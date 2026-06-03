"""预测模块 — 盲测预测创建与管理"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional

from .state import load_state, save_state, CHEAT_DIR
from .rubric import score_material, DIMENSIONS, DIMENSION_META

PREDICTIONS_DIR = CHEAT_DIR / "predictions"


def generate_id(thesis: str) -> str:
    """生成 12 字符预测 ID"""
    raw = f"predict-{thesis}-{datetime.now().isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:12]


def create_prediction(
    material_id: str,
    script_text: str,
    scores: dict[str, float],
    predicted_bucket: str,
    probability_distribution: dict[str, float],
    center_estimate: float,
    reasoning_factors: list[dict],
    anchor_comparison: list[dict],
    counterfactual_scenarios: list[str],
    critical_hypothesis: str,
) -> dict:
    """
    创建盲测预测（7 组件）
    """
    state = load_state()
    pred_id = generate_id(material_id)
    now = datetime.now().isoformat()

    # 评分
    score_result = score_material(scores, state)

    # 验证概率分布总和 = 100%
    prob_sum = sum(probability_distribution.values())
    if abs(prob_sum - 100) > 1:
        return {"error": f"概率分布总和必须为 100%，当前为 {prob_sum}%"}

    prediction = {
        "id": pred_id,
        "material_id": material_id,
        "created_at": now,
        "status": "predicted",  # predicted -> published -> retro_done
        # Component 1: 文件头
        "header": {
            "article_id": material_id,
            "calibration_samples": state.get("calibration_samples", 0),
            "confidence": _derive_confidence(state.get("calibration_samples", 0)),
            "scored_by": "user",
            "blind_scored": True,
            "rubric_version": state.get("rubric_version", 1),
        },
        # Component 2: 输入快照
        "input_snapshot": {
            "script_text": script_text[:500],  # 截断保存
            "script_hash": hashlib.sha256(script_text.encode()).hexdigest()[:16],
        },
        # Component 3: 预测
        "prediction": {
            "bucket": predicted_bucket,
            "probability_distribution": probability_distribution,
            "center_estimate_w": center_estimate,
            "one_line_reason": f"综合分 {score_result['composite']}，{predicted_bucket}",
        },
        # Component 4: 评分
        "score_result": score_result,
        # Component 5: 推理因素
        "reasoning_factors": reasoning_factors,
        # Component 6: 锚点对比
        "anchor_comparison": anchor_comparison,
        # Component 7: 反事实场景
        "counterfactual_scenarios": counterfactual_scenarios,
        # Component 8: 关键假设
        "critical_hypothesis": critical_hypothesis,
        # 复盘（初始为空）
        "retro": None,
    }

    # 保存到文件
    PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{datetime.now().strftime('%Y%m%d')}_{pred_id}_{material_id[:20]}.json"
    filepath = PREDICTIONS_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(prediction, f, ensure_ascii=False, indent=2)

    # 更新状态
    state["in_progress_session"] = pred_id
    save_state(state)

    return prediction


def list_predictions(status_filter: Optional[str] = None) -> list[dict]:
    """列出所有预测"""
    PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
    predictions = []
    for fp in sorted(PREDICTIONS_DIR.glob("*.json")):
        with open(fp, "r", encoding="utf-8") as f:
            pred = json.load(f)
        if status_filter and pred.get("status") != status_filter:
            continue
        predictions.append(pred)
    return predictions


def get_prediction(pred_id: str) -> Optional[dict]:
    """获取单个预测"""
    for fp in PREDICTIONS_DIR.glob("*.json"):
        with open(fp, "r", encoding="utf-8") as f:
            pred = json.load(f)
        if pred.get("id") == pred_id:
            return pred
    return None


def update_prediction(pred_id: str, updates: dict) -> Optional[dict]:
    """更新预测（仅允许非预测区域）"""
    for fp in PREDICTIONS_DIR.glob("*.json"):
        with open(fp, "r", encoding="utf-8") as f:
            pred = json.load(f)
        if pred.get("id") == pred_id:
            pred.update(updates)
            with open(fp, "w", encoding="utf-8") as f:
                json.dump(pred, f, ensure_ascii=False, indent=2)
            return pred
    return None


def _derive_confidence(n: int) -> str:
    """根据校准样本数推导置信度"""
    if n <= 2:
        return "red"  # 占星
    elif n <= 5:
        return "orange"  # 仅方向
    elif n <= 10:
        return "yellow"  # 参考
    elif n <= 20:
        return "green"  # 决策可用
    else:
        return "blue"  # 数据驱动