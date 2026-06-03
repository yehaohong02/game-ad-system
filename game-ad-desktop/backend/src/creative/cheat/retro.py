"""复盘模块 — T+N 天数据收集 + 预测 vs 实际对比"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from .state import load_state, save_state, CHEAT_DIR
from .rubric import classify_bucket

PREDICTIONS_DIR = CHEAT_DIR / "predictions"


def do_retro(
    pred_id: str,
    actual_plays: int,
    actual_likes: int = 0,
    actual_comments: int = 0,
    actual_shares: int = 0,
    actual_saves: int = 0,
    top_comments: list[str] = None,
    observations: list[str] = None,
) -> dict:
    """
    执行复盘：对比预测 vs 实际，提取观察
    """
    state = load_state()

    # 找到预测文件
    pred = None
    pred_file = None
    for fp in PREDICTIONS_DIR.glob("*.json"):
        with open(fp, "r", encoding="utf-8") as f:
            p = json.load(f)
        if p.get("id") == pred_id:
            pred = p
            pred_file = fp
            break

    if not pred:
        return {"error": f"预测 {pred_id} 不存在"}

    if pred.get("retro"):
        return {"error": f"预测 {pred_id} 已经复盘过"}

    # 计算实际表现
    predicted_center = pred["prediction"]["center_estimate_w"]
    actual_plays_w = actual_plays / 10000  # 转为万

    # 计算误差
    if predicted_center > 0:
        error_pct = abs(actual_plays_w - predicted_center) / predicted_center * 100
        signed_error_pct = (actual_plays_w - predicted_center) / predicted_center * 100
    else:
        error_pct = 0
        signed_error_pct = 0

    # 方向判断
    direction = "correct" if signed_error_pct >= 0 else "under"
    predicted_bucket = pred["prediction"]["bucket"]
    actual_bucket_info = classify_bucket(
        actual_plays_w / max(predicted_center, 0.01) * 5,  # 粗略映射
        boundaries=state.get("bucket_boundaries"),
    )

    # 构建复盘记录
    retro = {
        "retro_at": datetime.now().isoformat(),
        "days_since_publish": 3,  # 默认 T+3
        # 实际数据
        "actual": {
            "plays": actual_plays,
            "plays_w": round(actual_plays_w, 2),
            "likes": actual_likes,
            "comments": actual_comments,
            "shares": actual_shares,
            "saves": actual_saves,
            "like_to_play": round(actual_likes / max(actual_plays, 1), 4),
            "comment_to_play": round(actual_comments / max(actual_plays, 1), 4),
            "share_to_play": round(actual_shares / max(actual_plays, 1), 4),
        },
        # 预测 vs 实际对比
        "comparison": {
            "predicted_center_w": predicted_center,
            "actual_plays_w": round(actual_plays_w, 2),
            "error_pct": round(error_pct, 1),
            "signed_error_pct": round(signed_error_pct, 1),
            "direction": direction,
            "predicted_bucket": predicted_bucket,
            "actual_bucket": actual_bucket_info["bucket"],
        },
        # 评论关键词聚类
        "top_comments": top_comments or [],
        # 新观察
        "new_observations": observations or [],
        # 验证/证伪
        "verification": _verify_prediction(pred, actual_plays_w),
    }

    # 更新预测文件
    pred["retro"] = retro
    pred["status"] = "retro_done"
    with open(pred_file, "w", encoding="utf-8") as f:
        json.dump(pred, f, ensure_ascii=False, indent=2)

    # 更新状态
    state["calibration_samples"] = state.get("calibration_samples", 0) + 1
    state["last_retro_at"] = datetime.now().isoformat()
    if pred_id in state.get("pending_retros", []):
        state["pending_retros"].remove(pred_id)

    # 记录方向误差
    errors = state.get("consecutive_directional_errors", [])
    errors.append(direction)
    state["consecutive_directional_errors"] = errors[-10:]  # 只保留最近 10 个

    save_state(state)

    return {
        "status": "completed",
        "pred_id": pred_id,
        "retro": retro,
        "calibration_samples": state["calibration_samples"],
        "bump_trigger": _check_bump_trigger(state),
    }


def list_pending_retros() -> list[dict]:
    """列出待复盘的预测"""
    state = load_state()
    pending = []
    for pred in _list_all_predictions():
        if pred.get("status") == "published" and not pred.get("retro"):
            pending.append({
                "id": pred["id"],
                "material_id": pred.get("material_id"),
                "created_at": pred.get("created_at"),
                "predicted_bucket": pred["prediction"]["bucket"],
                "center_estimate_w": pred["prediction"]["center_estimate_w"],
            })
    return pending


def get_retro_stats() -> dict:
    """获取复盘统计"""
    all_preds = _list_all_predictions()
    done = [p for p in all_preds if p.get("retro")]
    if not done:
        return {"total": 0, "avg_error": 0, "direction_accuracy": 0}

    errors = [p["retro"]["comparison"]["error_pct"] for p in done]
    directions = [p["retro"]["comparison"]["direction"] for p in done]

    return {
        "total": len(done),
        "avg_error": round(sum(errors) / len(errors), 1),
        "direction_accuracy": round(directions.count("correct") / len(directions) * 100, 1),
        "best_error": round(min(errors), 1),
        "worst_error": round(max(errors), 1),
    }


def _verify_prediction(pred: dict, actual_w: float) -> list[dict]:
    """验证/证伪预测的各个要素"""
    results = []
    predicted_bucket = pred["prediction"]["bucket"]
    center = pred["prediction"]["center_estimate_w"]

    # 桶验证
    if center > 0:
        ratio = actual_w / center
        if ratio > 2:
            actual_bucket = "viral"
        elif ratio > 1:
            actual_bucket = "outperform"
        elif ratio > 0.5:
            actual_bucket = "average"
        else:
            actual_bucket = "flop"
    else:
        actual_bucket = "unknown"

    results.append({
        "element": "predicted_bucket",
        "predicted": predicted_bucket,
        "actual": actual_bucket,
        "verified": predicted_bucket == actual_bucket,
    })

    # 中枢验证（误差 < 30% 为准确）
    if center > 0:
        error = abs(actual_w - center) / center
        results.append({
            "element": "center_estimate",
            "predicted": f"{center}万",
            "actual": f"{round(actual_w, 2)}万",
            "verified": error < 0.3,
        })

    return results


def _check_bump_trigger(state: dict) -> dict:
    """检查是否应触发公式进化"""
    errors = state.get("consecutive_directional_errors", [])
    if len(errors) < 3:
        return {"should_bump": False, "reason": "样本不足"}

    # 检查最近 3 次是否同方向
    recent = errors[-3:]
    if all(d == "under" for d in recent):
        return {"should_bump": True, "reason": "连续 3 次低估，建议升级公式"}
    if all(d == "correct" for d in recent):
        # 连续高估也算
        pass

    # 检查平均误差
    all_preds = _list_all_predictions()
    done = [p for p in all_preds if p.get("retro")]
    if len(done) >= 5:
        recent_errors = [p["retro"]["comparison"]["error_pct"] for p in done[-5:]]
        avg_err = sum(recent_errors) / len(recent_errors)
        if avg_err > 50:
            return {"should_bump": True, "reason": f"近 5 次平均误差 {avg_err:.0f}%，建议升级公式"}

    return {"should_bump": False, "reason": "表现正常"}


def _list_all_predictions() -> list[dict]:
    """列出所有预测"""
    PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
    preds = []
    for fp in sorted(PREDICTIONS_DIR.glob("*.json")):
        with open(fp, "r", encoding="utf-8") as f:
            preds.append(json.load(f))
    return preds