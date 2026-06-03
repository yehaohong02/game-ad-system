"""
Phase 0 数据验证实验 API（完整版：34 维特征空间）

支持两种数据来源：
1. 默认：读取 materialData.json
2. 上传：接收 Excel 文件（.xlsx / .xls）
"""

from fastapi import APIRouter, Query, UploadFile, File
from pydantic import BaseModel
import json
from pathlib import Path
import numpy as np


def _to_native(obj):
    """递归把 numpy 类型转成 Python 原生类型，确保 Pydantic 可序列化"""
    if isinstance(obj, dict):
        return {k: _to_native(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_native(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

router = APIRouter()


class ExperimentResponse(BaseModel):
    status: str
    message: str | None = None
    recommendation: str | None = None
    data: dict | None = None


# ─── 统一特征名（34 维）───
FEATURE_NAMES = [
    # 视觉（14）
    "scene_真人讲解", "scene_战斗画面", "scene_宝箱奖励", "scene_快节奏剪辑",
    "scene_角色展示", "scene_新手教程", "scene_社交互动", "scene_剧情对话",
    "scene_UI界面操作", "scene_CG动画", "scene_游戏画面", "scene_福利展示",
    "scene_搞笑场景", "scene_对比测试",
    # 音频（4）
    "audio_marketing_intensity", "audio_has_voiceover",
    "audio_speech_rate", "audio_text_length_norm",
    # 时长（4）
    "dur_short", "dur_medium", "dur_long", "dur_extra_long",
    # 行为（12）
    "behav_hook_rate", "behav_mid_hook_rate", "behav_completion_rate",
    "behav_quarter_rate", "behav_half_rate",
    "behav_ctr", "behav_cpm_norm", "behav_cpc_norm",
    "behav_drop_2s_6s", "behav_drop_6s_25",
    "behav_drop_25_50", "behav_drop_50_100",
]

# ─── Excel 列名 → 内部字段名映射 ───
EXCEL_COLUMN_MAP = {
    "素材ID": "materialId",
    "预览链接": "preview",
    "游戏分类": "category",
    "素材花费": "spend",
    "素材展示数": "impressions",
    "素材千次展示成本": "cpm",
    "素材点击数": "clicks",
    "素材点击成本": "cpc",
    "素材点击率": "ctr",
    "播放次数": "playCount",
    "播放2s次数": "play2s",
    "播放6s次数": "play6s",
    "播放25%次数": "play25",
    "播放50%次数": "play50",
    "播放75%次数": "play75",
    "播放100%次数": "play100",
    "2s播放率": "play2s_rate",
    "6s播放率": "play6s_rate",
    "25%播放率": "play25_rate",
    "50%播放率": "play50_rate",
    "75%播放率": "play75_rate",
    "100%播放率": "play100_rate",
}


def _build_feature_vector(tags: dict, material: dict) -> dict[str, float]:
    """从 CreativeTags + MaterialRecord 构建 34 维特征向量"""
    features: dict[str, float] = {}

    # ─── 视觉特征：scene_scores（连续值）───
    scene_scores = tags.get("scene_scores", {})
    for label in [
        "真人讲解", "战斗画面", "宝箱奖励", "快节奏剪辑", "角色展示",
        "新手教程", "社交互动", "剧情对话", "UI界面操作", "CG动画",
        "游戏画面", "福利展示", "搞笑场景", "对比测试",
    ]:
        features[f"scene_{label}"] = scene_scores.get(label, 0.0)

    # ─── 音频特征 ───
    features["audio_marketing_intensity"] = tags.get("marketing_intensity", 0.0)
    features["audio_has_voiceover"] = 1.0 if tags.get("has_voiceover", False) else 0.0
    features["audio_speech_rate"] = min(tags.get("speech_rate", 0.0) / 10.0, 1.0)
    features["audio_text_length_norm"] = min(tags.get("text_length", 0) / 500.0, 1.0)

    # ─── 时长特征（one-hot）───
    duration = tags.get("duration_seconds", 0)
    bucket = tags.get("duration_bucket", "")
    if not bucket:
        if duration < 15:
            bucket = "short"
        elif duration < 30:
            bucket = "medium"
        elif duration < 60:
            bucket = "long"
        else:
            bucket = "extra_long"

    features["dur_short"] = 1.0 if bucket == "short" else 0.0
    features["dur_medium"] = 1.0 if bucket == "medium" else 0.0
    features["dur_long"] = 1.0 if bucket == "long" else 0.0
    features["dur_extra_long"] = 1.0 if bucket == "extra_long" else 0.0

    # ─── 行为特征（12 个）───
    pc = max(material.get("playCount", 0), 1)
    play2s = material.get("play2s", 0)
    play6s = material.get("play6s", 0)
    play25 = material.get("play25", 0)
    play50 = material.get("play50", 0)
    play100 = material.get("play100", 0)

    features["behav_hook_rate"] = play2s / pc
    features["behav_mid_hook_rate"] = play6s / pc
    features["behav_completion_rate"] = play100 / pc
    features["behav_quarter_rate"] = play25 / pc
    features["behav_half_rate"] = play50 / pc
    features["behav_ctr"] = material.get("ctr", 0)
    features["behav_cpm_norm"] = min(material.get("cpm", 0) / 100.0, 1.0)
    features["behav_cpc_norm"] = min(material.get("cpc", 0) / 10.0, 1.0)
    features["behav_drop_2s_6s"] = play6s / max(play2s, 1)
    features["behav_drop_6s_25"] = play25 / max(play6s, 1)
    features["behav_drop_25_50"] = play50 / max(play25, 1)
    features["behav_drop_50_100"] = play100 / max(play50, 1)

    return features


def _run_experiment(valid: list[dict], tags_index: dict[str, dict] | None = None) -> dict:
    """核心实验逻辑，valid 为标准化后的素材列表"""
    import numpy as np
    from scipy import stats

    if tags_index is None:
        tags_index = {}

    # ─── 构建特征向量 ───
    roas_list = []
    feature_vectors = []

    for m in valid:
        mid = m.get("materialId", "")
        tags = tags_index.get(mid, tags_index.get(m.get("videoId", ""), {}))
        features = _build_feature_vector(tags, m)
        feature_vectors.append(features)

        # ROAS：优先用显式值，否则用 spend 代理（花费越高排名越靠前 = 效率指标）
        roas = m.get("roas", 0)
        if roas == 0:
            roas = m.get("spend", 0)
        roas_list.append(roas)

    roas_values = np.array(roas_list, dtype=float)
    X = np.array([[fv.get(name, 0.0) for name in FEATURE_NAMES] for fv in feature_vectors])

    # ─── Step 1: 特征重要性（Spearman）───
    feature_importance = []
    for i, name in enumerate(FEATURE_NAMES):
        col = X[:, i]
        if np.std(col) < 1e-8:
            continue
        rho, pvalue = stats.spearmanr(col, roas_values)
        feature_importance.append({
            "feature": name,
            "spearman_rho": round(float(rho), 4),
            "pvalue": round(float(pvalue), 4),
            "is_significant": bool(pvalue < 0.05),
        })
    feature_importance.sort(key=lambda x: abs(x["spearman_rho"]), reverse=True)

    # ─── Step 2: 公式回测 ───
    formula_category_map = {
        "f1": ["SLG", "建造", "经营", "模拟", "生存", "末世", "策略"],
        "f2": ["RPG", "剧情", "真人", "角色扮演", "冒险"],
        "f3": ["休闲", "解压", "治愈", "模拟经营", "农场", "田园"],
        "f4": ["竞技", "MOBA", "射击", "动作", "吃鸡", "枪战"],
        "f5": ["竞技", "MOBA", "技巧", "对战", "5v5"],
        "f6": ["RPG", "卡牌", "角色", "策略", "放置"],
        "f7": ["休闲", "益智", "解压", "三消", "消除"],
    }
    formula_names = {
        "f1": "末世生存+建造经营", "f2": "真人剧情+游戏混剪",
        "f3": "解压治愈+放松逃离", "f4": "突发事件+快速响应",
        "f5": "真人出镜+技巧展示", "f6": "新角色/新玩法首发",
        "f7": "短平快+高频测试",
    }

    scene_to_formula = {
        "真人讲解": ["f2", "f5"], "战斗画面": ["f4"], "宝箱奖励": ["f1", "f6"],
        "快节奏剪辑": ["f4", "f7"], "角色展示": ["f2", "f6"], "新手教程": ["f3"],
        "社交互动": ["f2"], "剧情对话": ["f2", "f6"], "UI界面操作": ["f1", "f6"],
        "CG动画": ["f3", "f7"], "游戏画面": ["f1", "f4"], "福利展示": ["f3"],
        "搞笑场景": ["f3", "f7"], "对比测试": ["f4", "f5"],
    }

    formula_backtests = []
    for fid, cats in formula_category_map.items():
        matched_indices = []
        for i, m in enumerate(valid):
            category_match = any(c in m.get("category", "") for c in cats)
            scene_score = sum(
                feature_vectors[i].get(f"scene_{scene}", 0.0)
                for scene, formulas in scene_to_formula.items()
                if fid in formulas
            )
            if category_match or scene_score > 0.3:
                matched_indices.append(i)

        if len(matched_indices) < 2:
            formula_backtests.append({
                "formula_id": fid, "formula_name": formula_names[fid],
                "matched_count": len(matched_indices), "is_significant": False,
                "lift": 0, "ttest_pvalue": 1.0,
            })
            continue

        matched_roas = roas_values[matched_indices]
        unmatched_mask = np.ones(len(roas_values), dtype=bool)
        unmatched_mask[matched_indices] = False
        unmatched_roas = roas_values[unmatched_mask]

        matched_avg = float(np.mean(matched_roas))
        unmatched_avg = float(np.mean(unmatched_roas)) if len(unmatched_roas) > 0 else 0.0
        lift = matched_avg / unmatched_avg if unmatched_avg > 0 else 0.0

        _, pvalue = stats.ttest_ind(matched_roas, unmatched_roas) if len(unmatched_roas) > 0 else (0, 1.0)

        formula_backtests.append({
            "formula_id": fid, "formula_name": formula_names[fid],
            "matched_count": len(matched_indices),
            "matched_avg_roas": round(matched_avg, 4),
            "unmatched_avg_roas": round(unmatched_avg, 4),
            "lift": round(lift, 2),
            "ttest_pvalue": round(float(pvalue), 4),
            "is_significant": bool(float(pvalue) < 0.05 and lift > 1.0),
        })

    # ─── Step 3: 排名可预测性（Spearman ρ + Ridge LOO）───
    from sklearn.linear_model import Ridge
    from sklearn.model_selection import LeaveOneOut

    loo = LeaveOneOut()
    predictions = np.zeros(len(roas_values))
    for train_idx, test_idx in loo.split(X):
        model = Ridge(alpha=1.0)
        model.fit(X[train_idx], roas_values[train_idx])
        predictions[test_idx] = model.predict(X[test_idx])

    spearman_rho, spearman_p = stats.spearmanr(roas_values, predictions)

    def ndcg_at_k(y_true, y_pred, k):
        order = np.argsort(y_pred)[::-1]
        y_sorted = y_true[order]
        dcg = sum(y_sorted[i] / np.log2(i + 2) for i in range(min(k, len(y_sorted))))
        ideal = np.sort(y_true)[::-1]
        idcg = sum(ideal[i] / np.log2(i + 2) for i in range(min(k, len(ideal))))
        return dcg / idcg if idcg > 0 else 0

    ndcg_5 = ndcg_at_k(roas_values, predictions, 5)
    ndcg_10 = ndcg_at_k(roas_values, predictions, 10)

    if spearman_rho >= 0.4:
        recommendation = "go"
        details = f"Spearman ρ={spearman_rho:.3f} ≥ 0.4，标签+行为特征有排名预测能力，建议建设闭环系统"
    elif spearman_rho <= 0.2:
        recommendation = "no-go"
        details = f"Spearman ρ={spearman_rho:.3f} ≤ 0.2，特征预测能力不足，建议转向回顾性分析"
    else:
        recommendation = "borderline"
        details = f"Spearman ρ={spearman_rho:.3f} 处于灰色地带，建议先做 Phase 1（公式健康度），观察效果后再决定"

    model_full = Ridge(alpha=1.0)
    model_full.fit(X, roas_values)
    model_importance = {
        name: round(float(coef), 4)
        for name, coef in zip(FEATURE_NAMES, model_full.coef_)
    }

    effective_formulas = [f for f in formula_backtests if f["is_significant"]]

    category_summary = {
        "visual": {"count": 14, "features": FEATURE_NAMES[:14]},
        "audio": {"count": 4, "features": FEATURE_NAMES[14:18]},
        "duration": {"count": 4, "features": FEATURE_NAMES[18:22]},
        "behavioral": {"count": 12, "features": FEATURE_NAMES[22:34]},
    }

    return _to_native({
        "sample_count": len(valid),
        "feature_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "category_summary": category_summary,
        "feature_importance": feature_importance,
        "model_coefficients": model_importance,
        "formula_backtest": {
            "total_formulas": len(formula_backtests),
            "effective_formulas": len(effective_formulas),
            "results": formula_backtests,
        },
        "predictability": {
            "spearman_rho": round(float(spearman_rho), 4),
            "spearman_pvalue": round(float(spearman_p), 4),
            "ndcg_at_5": round(float(ndcg_5), 4),
            "ndcg_at_10": round(float(ndcg_10), 4),
            "recommendation": recommendation,
            "details": details,
        },
    })


def _parse_excel_to_materials(file_bytes: bytes, filename: str) -> list[dict]:
    """解析 Excel 文件为标准化素材列表"""
    import pandas as pd
    import io

    # 根据文件扩展名选择引擎
    if filename.endswith(".xlsx"):
        engine = "openpyxl"
    elif filename.endswith(".xls"):
        engine = "xlrd"
    else:
        engine = "openpyxl"

    df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=0, header=1, engine=engine)

    # 清理列名空格
    df.columns = [str(c).strip() for c in df.columns]

    # 映射列名
    rename_map = {}
    for cn, internal in EXCEL_COLUMN_MAP.items():
        if cn in df.columns:
            rename_map[cn] = internal
    df = df.rename(columns=rename_map)

    # 过滤掉汇总行和空行
    if "materialId" in df.columns:
        df = df[df["materialId"].notna()]
        df = df[df["materialId"].astype(str) != "汇总"]
        df = df[df["materialId"].astype(str).str.strip() != ""]

    if "spend" in df.columns:
        df = df[pd.to_numeric(df["spend"], errors="coerce").fillna(0) > 0]

    # 转为 dict 列表
    records = []
    for _, row in df.iterrows():
        m = {}
        for col in df.columns:
            val = row[col]
            if pd.isna(val):
                val = 0
            elif isinstance(val, str) and val.replace(".", "").replace("-", "").isdigit():
                val = float(val)
            m[col] = val
        records.append(m)

    return records


# ═══════════════════════════════════════════════════
# API 端点
# ═══════════════════════════════════════════════════

@router.post("/phase0")
async def run_phase0(account_id: str = Query(default="default")):
    """运行 Phase 0 实验（默认数据源：materialData.json）"""
    try:
        data_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "data" / "materialData.json"
        if not data_path.exists():
            return ExperimentResponse(status="no_data", message="未找到素材数据", recommendation="no-go")

        with open(data_path, "r", encoding="utf-8") as f:
            materials = json.load(f)

        valid = [m for m in materials if m.get("spend", 0) > 0 and m.get("category") and m.get("materialId") != "汇总"]

        if len(valid) < 5:
            return ExperimentResponse(
                status="insufficient_data",
                message=f"有效素材不足（{len(valid)} 条 < 5）",
                recommendation="no-go",
            )

        # 加载 CLIP 标签
        tags_dir = Path(__file__).parent.parent.parent / "output" / "creative_tags"
        tags_index: dict[str, dict] = {}
        if tags_dir.exists():
            for fp in tags_dir.glob("*.json"):
                with open(fp, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                    tags_index[data.get("video_id", fp.stem)] = data

        result = _run_experiment(valid, tags_index)
        return ExperimentResponse(
            status="completed",
            recommendation=result["predictability"]["recommendation"],
            data=result,
        )

    except ImportError as e:
        return ExperimentResponse(status="dependency_error", message=f"缺少依赖: {e}", recommendation="no-go")
    except Exception as e:
        return ExperimentResponse(status="error", message=str(e), recommendation="no-go")


@router.post("/phase0/upload")
async def run_phase0_upload(file: UploadFile = File(...)):
    """
    运行 Phase 0 实验（Excel 上传模式）

    支持 .xlsx / .xls 文件，表头在第 2 行（index=1），
    第 1 行为数据说明，自动跳过。
    """
    try:
        filename = file.filename or "upload.xlsx"
        file_bytes = await file.read()

        materials = _parse_excel_to_materials(file_bytes, filename)

        if len(materials) < 5:
            return ExperimentResponse(
                status="insufficient_data",
                message=f"有效素材不足（{len(materials)} 条 < 5），请检查表格格式",
                recommendation="no-go",
            )

        # 加载 CLIP 标签
        tags_dir = Path(__file__).parent.parent.parent / "output" / "creative_tags"
        tags_index: dict[str, dict] = {}
        if tags_dir.exists():
            for fp in tags_dir.glob("*.json"):
                with open(fp, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                    tags_index[data.get("video_id", fp.stem)] = data

        result = _run_experiment(materials, tags_index)

        # ─── 自动触发 Cheat 评分（基于实际表现数据）───
        from src.creative.cheat.state import load_state
        from src.creative.cheat.rubric import score_material

        state = load_state()
        if state.get("created_at"):
            # 提取所有素材的表现指标，用于百分位排名
            def _safe(v):
                try:
                    return float(v) if v else 0
                except (ValueError, TypeError):
                    return 0

            metrics = []
            for m in materials:
                metrics.append({
                    "materialId": str(m.get("materialId", "")),
                    "spend": _safe(m.get("spend")),
                    "impressions": _safe(m.get("impressions")),
                    "ctr": _safe(m.get("ctr")),
                    "cpm": _safe(m.get("cpm")),
                    "cpc": _safe(m.get("cpc")),
                    "play2s_rate": _safe(m.get("play2s_rate")),
                    "play6s_rate": _safe(m.get("play6s_rate")),
                    "play25_rate": _safe(m.get("play25_rate")),
                    "play50_rate": _safe(m.get("play50_rate")),
                    "play75_rate": _safe(m.get("play75_rate")),
                    "play100_rate": _safe(m.get("play100_rate")),
                    "playCount": _safe(m.get("playCount")),
                    "category": m.get("category", ""),
                })

            # 按花费过滤有效素材
            valid = [m for m in metrics if m["spend"] > 0]

            def _percentile_rank(values):
                """计算每个值在列表中的百分位排名 (0-1)"""
                sorted_v = sorted(values)
                n = len(sorted_v)
                if n <= 1:
                    return [0.5] * n
                return [sorted_v.index(v) / (n - 1) for v in values]

            # 计算各指标的百分位排名
            ctrs = [m["ctr"] for m in valid]
            p2s = [m["play2s_rate"] for m in valid]
            p100 = [m["play100_rate"] for m in valid]
            p50 = [m["play50_rate"] for m in valid]
            plays = [m["playCount"] for m in valid]
            cpcs = [m["cpc"] for m in valid]
            cpms = [m["cpm"] for m in valid]

            ctr_ranks = _percentile_rank(ctrs)
            p2s_ranks = _percentile_rank(p2s)
            p100_ranks = _percentile_rank(p100)
            p50_ranks = _percentile_rank(p50)
            play_ranks = _percentile_rank(plays)
            cpc_ranks = _percentile_rank([1 / max(c, 0.01) for c in cpcs])  # CPC 越低越好，取倒数
            cpm_ranks = _percentile_rank([1 / max(c, 0.01) for c in cpms])  # CPM 越低越好

            cheat_scores = []
            for i, m in enumerate(valid):
                # 用实际表现数据映射 7 维度 (0-5 分，基于百分位)
                scores = {
                    "ER": round(ctr_ranks[i] * 5, 1),          # 情感共鸣 ← CTR（点击率高=共鸣强）
                    "SR": round(cpc_ranks[i] * 5, 1),          # 社会共鸣 ← CPC 效率（获客成本低=传播广）
                    "HP": round(p2s_ranks[i] * 5, 1),          # 钩子潜力 ← 2s 播放率（前 3 秒留存）
                    "QL": round(p50_ranks[i] * 5, 1),          # 金句密度 ← 50% 播放率（看完一半=有料）
                    "NA": round(p100_ranks[i] * 5, 1),         # 叙事性 ← 100% 播放率（看完=故事好）
                    "AB": round(play_ranks[i] * 5, 1),         # 受众广度 ← 总播放量（量大=覆盖面广）
                    "SAT": round(cpm_ranks[i] * 5, 1),         # 投放效率 ← CPM 效率（千次曝光成本低）
                }
                result_score = score_material(scores, state)
                cheat_scores.append({
                    "material_id": m["materialId"],
                    "category": m["category"],
                    "spend": m["spend"],
                    "playCount": int(m["playCount"]),
                    "ctr": round(m["ctr"], 4),
                    "play2s_rate": round(m["play2s_rate"], 4),
                    "play100_rate": round(m["play100_rate"], 4),
                    "scores": scores,
                    "composite": result_score["composite"],
                    "bucket": result_score["bucket"],
                    "bucket_label": result_score["bucket_label"],
                })

            # 按综合分排序
            cheat_scores.sort(key=lambda x: x["composite"], reverse=True)

            result["cheat_scores"] = cheat_scores
            result["cheat_scored_count"] = len(cheat_scores)

        return ExperimentResponse(
            status="completed",
            recommendation=result["predictability"]["recommendation"],
            data=result,
        )

    except ImportError as e:
        return ExperimentResponse(status="dependency_error", message=f"缺少依赖: {e}", recommendation="no-go")
    except Exception as e:
        import traceback
        return ExperimentResponse(status="error", message=f"{e}\n{traceback.format_exc()}", recommendation="no-go")