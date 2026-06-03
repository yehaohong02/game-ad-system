"""
Cheat-on-Content API — Score → Predict → Publish → Retro → Evolve 完整闭环
"""

from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


# ─── 请求模型 ───

class InitRequest(BaseModel):
    content_form: str = "opinion-video"
    platform: str = "douyin"
    cadence_days: int = 3


class ScoreRequest(BaseModel):
    material_id: str
    script_text: str = ""
    scores: dict[str, float]  # {"ER": 3.5, "SR": 4.0, ...}


class PredictRequest(BaseModel):
    material_id: str
    script_text: str
    scores: dict[str, float]
    predicted_bucket: str = "average"
    probability_distribution: dict[str, float] = {}
    center_estimate: float = 1.0
    reasoning_factors: list[dict] = []
    anchor_comparison: list[dict] = []
    counterfactual_scenarios: list[str] = []
    critical_hypothesis: str = ""


class PublishRequest(BaseModel):
    pred_id: str
    url: str = ""
    platform: str = ""
    published_at: str = ""


class RetroRequest(BaseModel):
    pred_id: str
    actual_plays: int
    actual_likes: int = 0
    actual_comments: int = 0
    actual_shares: int = 0
    actual_saves: int = 0
    top_comments: list[str] = []
    observations: list[str] = []


class BumpRequest(BaseModel):
    new_weights: Optional[dict[str, float]] = None
    auto: bool = True


class BenchmarkRequest(BaseModel):
    account_name: str
    samples: list[dict]  # [{"material_id": "...", "plays": 10000, "script_text": "...", "impression": "high"}]


# ─── 状态 ───

@router.get("/status")
async def get_status():
    """状态仪表盘"""
    from src.creative.cheat.state import load_state, CHEAT_DIR
    from src.creative.cheat.predict import list_predictions
    from src.creative.cheat.retro import get_retro_stats, list_pending_retros
    import json

    state = load_state()
    predictions = list_predictions()
    retro_stats = get_retro_stats()
    pending = list_pending_retros()

    # 缓冲区计算
    buffer_count = len(state.get("shoots", []))
    cadence = state.get("target_publish_cadence_days", 3)
    buffer_days = buffer_count * cadence
    if buffer_days < 1:
        buffer_color = "red"
    elif buffer_days < 2:
        buffer_color = "orange"
    elif buffer_days < 5:
        buffer_color = "green"
    else:
        buffer_color = "blue"

    # 置信度
    n = state.get("calibration_samples", 0)
    if n <= 2:
        confidence = "red"
    elif n <= 5:
        confidence = "orange"
    elif n <= 10:
        confidence = "yellow"
    elif n <= 20:
        confidence = "green"
    else:
        confidence = "blue"

    # 候选选题
    candidates_file = CHEAT_DIR / "candidates" / "candidates.json"
    candidates = []
    if candidates_file.exists():
        with open(candidates_file, "r", encoding="utf-8") as f:
            candidates = json.load(f)

    return {
        "state": {
            "schema_version": state.get("schema_version"),
            "content_form": state.get("content_form"),
            "platform": state.get("platform"),
            "rubric_version": state.get("rubric_version"),
            "calibration_samples": n,
            "confidence": confidence,
        },
        "buffer": {
            "count": buffer_count,
            "days": buffer_days,
            "color": buffer_color,
        },
        "predictions": {
            "total": len(predictions),
            "predicted": len([p for p in predictions if p.get("status") == "predicted"]),
            "published": len([p for p in predictions if p.get("status") == "published"]),
            "retro_done": len([p for p in predictions if p.get("status") == "retro_done"]),
        },
        "retro": retro_stats,
        "pending_retros": pending,
        "candidates": len(candidates),
        "bump_trigger": _check_bump_trigger(state),
    }


@router.post("/init")
async def init_project(req: InitRequest):
    """初始化项目"""
    from src.creative.cheat.state import init_state
    state = init_state(req.content_form, req.platform, req.cadence_days)
    return {"status": "initialized", "state": state}


# ─── 评分 ───

@router.post("/score")
async def score_content(req: ScoreRequest):
    """对素材/脚本评分"""
    from src.creative.cheat.rubric import score_material
    from src.creative.cheat.state import load_state
    state = load_state()
    result = score_material(req.scores, state)
    return {"status": "scored", "material_id": req.material_id, "result": result}


@router.get("/dimensions")
async def get_dimensions():
    """获取评分维度定义"""
    from src.creative.cheat.rubric import DIMENSION_META, DIMENSIONS
    from src.creative.cheat.state import load_state
    state = load_state()
    dims = state.get("rubric_dimensions", {})
    return {
        "dimensions": [
            {
                "key": dim,
                "name": DIMENSION_META[dim]["name"],
                "desc": DIMENSION_META[dim]["desc"],
                "weight": dims.get(dim, {}).get("weight", 1.0),
            }
            for dim in DIMENSIONS
        ],
        "formula": state.get("rubric_formula", ""),
        "bucket_boundaries": state.get("bucket_boundaries", {}),
    }


# ─── 预测 ───

@router.post("/predict")
async def create_prediction(req: PredictRequest):
    """创建盲测预测"""
    from src.creative.cheat.predict import create_prediction

    # 如果没有提供概率分布，自动生成
    prob = req.probability_distribution
    if not prob:
        prob = {"viral": 5, "outperform": 20, "average": 50, "underperform": 20, "flop": 5}

    result = create_prediction(
        material_id=req.material_id,
        script_text=req.script_text,
        scores=req.scores,
        predicted_bucket=req.predicted_bucket,
        probability_distribution=prob,
        center_estimate=req.center_estimate,
        reasoning_factors=req.reasoning_factors,
        anchor_comparison=req.anchor_comparison,
        counterfactual_scenarios=req.counterfactual_scenarios,
        critical_hypothesis=req.critical_hypothesis,
    )

    if "error" in result:
        return {"status": "error", "message": result["error"]}

    return {"status": "predicted", "prediction": result}


@router.get("/predictions")
async def list_predictions(status: str = Query(default=None)):
    """列出所有预测"""
    from src.creative.cheat.predict import list_predictions
    preds = list_predictions(status_filter=status)
    return {"predictions": preds, "total": len(preds)}


@router.get("/predictions/{pred_id}")
async def get_prediction(pred_id: str):
    """获取单个预测"""
    from src.creative.cheat.predict import get_prediction
    pred = get_prediction(pred_id)
    if not pred:
        return {"status": "not_found"}
    return {"status": "found", "prediction": pred}


# ─── 发布 ───

@router.post("/publish")
async def mark_published(req: PublishRequest):
    """标记素材已发布"""
    from src.creative.cheat.predict import update_prediction, get_prediction
    from src.creative.cheat.state import load_state, save_state

    pred = get_prediction(req.pred_id)
    if not pred:
        return {"status": "error", "message": "预测不存在"}

    updates = {
        "status": "published",
        "publish_info": {
            "url": req.url,
            "platform": req.platform,
            "published_at": req.published_at or datetime.now().isoformat(),
        },
    }
    updated = update_prediction(req.pred_id, updates)

    # 更新状态
    state = load_state()
    state["last_published_at"] = datetime.now().isoformat()
    state["last_published_file"] = req.pred_id
    if req.pred_id not in state.get("pending_retros", []):
        state.setdefault("pending_retros", []).append(req.pred_id)
    if req.pred_id in state.get("shoots", []):
        state["shoots"].remove(req.pred_id)
    save_state(state)

    return {"status": "published", "pred_id": req.pred_id}


# ─── 复盘 ───

@router.post("/retro")
async def do_retro(req: RetroRequest):
    """执行复盘"""
    from src.creative.cheat.retro import do_retro
    result = do_retro(
        pred_id=req.pred_id,
        actual_plays=req.actual_plays,
        actual_likes=req.actual_likes,
        actual_comments=req.actual_comments,
        actual_shares=req.actual_shares,
        actual_saves=req.actual_saves,
        top_comments=req.top_comments,
        observations=req.observations,
    )
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    return result


@router.get("/retro/pending")
async def get_pending_retros():
    """获取待复盘列表"""
    from src.creative.cheat.retro import list_pending_retros
    return {"pending": list_pending_retros()}


@router.get("/retro/stats")
async def get_retro_statistics():
    """获取复盘统计"""
    from src.creative.cheat.retro import get_retro_stats
    return get_retro_stats()


# ─── 公式进化 ───

@router.get("/bias")
async def analyze_bias():
    """分析系统性偏差"""
    from src.creative.cheat.evolve import analyze_bias
    return analyze_bias()


@router.post("/bump")
async def trigger_bump(req: BumpRequest):
    """触发公式进化"""
    from src.creative.cheat.evolve import propose_bump, apply_bump
    proposal = propose_bump(new_weights=req.new_weights)

    if proposal.get("status") == "insufficient_data":
        return proposal

    if req.auto and proposal.get("passes_threshold"):
        result = apply_bump(
            new_weights={dim: w["new"] for dim, w in proposal["weight_changes"].items()} if proposal.get("weight_changes") else req.new_weights or {},
            new_formula=proposal["proposed_formula"],
        )
        return {"proposal": proposal, "applied": result}

    return {"proposal": proposal, "applied": False, "message": "公式变更需确认"}


@router.get("/evolution")
async def get_evolution_history():
    """获取公式进化历史"""
    from src.creative.cheat.evolve import get_evolution_history
    return {"history": get_evolution_history()}


# ─── 对标导入 ───

@router.post("/benchmark")
async def import_benchmark(req: BenchmarkRequest):
    """导入对标账号数据"""
    from src.creative.cheat.state import load_state, save_state, CHEAT_DIR
    import json

    state = load_state()
    samples_dir = CHEAT_DIR / "samples" / req.account_name
    samples_dir.mkdir(parents=True, exist_ok=True)

    imported = []
    for sample in req.samples:
        sample_id = sample.get("material_id", "")
        sample_file = samples_dir / f"{sample_id}.json"
        with open(sample_file, "w", encoding="utf-8") as f:
            json.dump(sample, f, ensure_ascii=False, indent=2)
        imported.append(sample_id)

    state["benchmark_imported"] = True
    state["benchmark_account"] = req.account_name
    save_state(state)

    return {
        "status": "imported",
        "account": req.account_name,
        "count": len(imported),
        "sample_ids": imported,
    }


# ─── 趋势 ───

@router.get("/trends")
async def get_trends():
    """获取趋势话题（手动模式）"""
    from src.creative.cheat.state import load_state, CHEAT_DIR
    import json

    candidates_file = CHEAT_DIR / "candidates" / "candidates.json"
    if candidates_file.exists():
        with open(candidates_file, "r", encoding="utf-8") as f:
            candidates = json.load(f)
    else:
        candidates = []

    return {"candidates": candidates, "total": len(candidates)}


@router.post("/trends/add")
async def add_trend_candidate(candidate: dict = Body(...)):
    """添加趋势候选"""
    from src.creative.cheat.state import CHEAT_DIR
    import json, hashlib

    candidates_file = CHEAT_DIR / "candidates" / "candidates.json"
    if candidates_file.exists():
        with open(candidates_file, "r", encoding="utf-8") as f:
            candidates = json.load(f)
    else:
        candidates = []

    # 生成 ID
    raw = f"{candidate.get('source', 'manual')}-{candidate.get('title', '')}"
    candidate["id"] = hashlib.sha256(raw.encode()).hexdigest()[:12]
    candidate["added_at"] = datetime.now().isoformat()
    candidate.setdefault("tier", "tier2")
    candidate.setdefault("status", "new")

    candidates.append(candidate)

    candidates_file.parent.mkdir(parents=True, exist_ok=True)
    with open(candidates_file, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)

    return {"status": "added", "id": candidate["id"]}


# ─── Score Curve ───

@router.get("/score-curve")
async def get_score_curve():
    """预测准确度收敛图数据"""
    from src.creative.cheat.predict import list_predictions

    preds = list_predictions()
    retro_done = [p for p in preds if p.get("retro")]

    if not retro_done:
        return {"data": [], "message": "暂无复盘数据"}

    curve_data = []
    for p in retro_done:
        retro = p["retro"]
        curve_data.append({
            "id": p["id"],
            "date": p.get("created_at", ""),
            "predicted_w": p["prediction"]["center_estimate_w"],
            "actual_w": retro["actual"]["plays_w"],
            "error_pct": retro["comparison"]["error_pct"],
            "signed_error_pct": retro["comparison"]["signed_error_pct"],
            "bucket": p["prediction"]["bucket"],
        })

    # 滚动平均
    window = min(5, len(curve_data))
    rolling_errors = []
    for i in range(len(curve_data)):
        start = max(0, i - window + 1)
        avg = sum(d["error_pct"] for d in curve_data[start:i + 1]) / (i - start + 1)
        rolling_errors.append(round(avg, 1))

    return {
        "data": curve_data,
        "rolling_errors": rolling_errors,
        "avg_error": round(sum(d["error_pct"] for d in curve_data) / len(curve_data), 1),
        "target_error": 25,
    }


def _check_bump_trigger(state: dict) -> dict:
    """检查是否应触发公式进化"""
    errors = state.get("consecutive_directional_errors", [])
    if len(errors) < 3:
        return {"should_bump": False, "reason": "样本不足"}
    recent = errors[-3:]
    if all(d == "under" for d in recent):
        return {"should_bump": True, "reason": "连续 3 次低估"}
    if all(d == "over" for d in recent):
        return {"should_bump": True, "reason": "连续 3 次高估"}
    return {"should_bump": False, "reason": "表现正常"}