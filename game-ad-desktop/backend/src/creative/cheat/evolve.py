"""公式进化模块 — 检测系统性偏差，升级评分公式"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional
import numpy as np

from .state import load_state, save_state, CHEAT_DIR
from .rubric import DIMENSIONS, compute_composite

PREDICTIONS_DIR = CHEAT_DIR / "predictions"


def analyze_bias() -> dict:
    """分析当前预测的系统性偏差"""
    preds = _get_retro_done()
    if len(preds) < 3:
        return {"status": "insufficient_data", "message": f"需要至少 3 个复盘样本，当前 {len(preds)} 个"}

    signed_errors = [p["retro"]["comparison"]["signed_error_pct"] for p in preds]
    avg_error = np.mean(signed_errors)
    std_error = np.std(signed_errors)

    # 方向统计
    under_count = sum(1 for e in signed_errors if e < -20)
    over_count = sum(1 for e in signed_errors if e > 20)
    accurate = sum(1 for e in signed_errors if -20 <= e <= 20)

    # 各维度与误差的相关性
    dimension_correlation = {}
    for dim in DIMENSIONS:
        dim_scores = [p["score_result"]["scores"].get(dim, 0) for p in preds]
        if len(set(dim_scores)) > 1:
            corr = np.corrcoef(dim_scores, signed_errors)[0, 1]
            dimension_correlation[dim] = round(float(corr), 3)

    # 排序找出最有问题的维度
    sorted_dims = sorted(dimension_correlation.items(), key=lambda x: abs(x[1]), reverse=True)

    return {
        "status": "analyzed",
        "sample_count": len(preds),
        "avg_signed_error": round(float(avg_error), 1),
        "std_error": round(float(std_error), 1),
        "bias_direction": "underestimate" if avg_error < -10 else "overestimate" if avg_error > 10 else "balanced",
        "distribution": {"under": under_count, "over": over_count, "accurate": accurate},
        "dimension_correlation": dict(sorted_dims),
        "recommendation": _generate_recommendation(avg_error, sorted_dims, len(preds)),
    }


def propose_bump(
    new_weights: Optional[dict[str, float]] = None,
    new_bucket_boundaries: Optional[dict] = None,
) -> dict:
    """
    提出公式升级方案
    如果未提供新权重，自动根据偏差分析推导
    """
    state = load_state()
    bias = analyze_bias()

    if bias.get("status") == "insufficient_data":
        return bias

    # 自动推导新权重
    if not new_weights:
        new_weights = {}
        current_dims = state.get("rubric_dimensions", {})
        for dim in DIMENSIONS:
            current_weight = current_dims.get(dim, {}).get("weight", 1.0)
            corr = bias.get("dimension_correlation", {}).get(dim, 0)

            # 如果某维度与误差强负相关（高分但实际低），降低权重
            if corr < -0.3:
                new_weights[dim] = max(0.5, current_weight - 0.3)
            elif corr > 0.3:
                new_weights[dim] = min(2.5, current_weight + 0.2)
            else:
                new_weights[dim] = current_weight

    # 构建新公式
    terms = []
    total_weight = 0
    for dim in DIMENSIONS:
        w = new_weights.get(dim, 1.0)
        if w == 1.0:
            terms.append(dim)
        else:
            terms.append(f"{dim}*{w}")
        total_weight += w

    new_formula = f"({' + '.join(terms)}) / {total_weight} * 2.0"

    # 计算新旧公式的排名一致性
    old_ranking = _compute_ranking(state.get("rubric_dimensions", {}))
    new_dims = {dim: {"weight": new_weights.get(dim, 1.0)} for dim in DIMENSIONS}
    new_ranking = _compute_ranking(new_dims)

    consistency = _rank_consistency(old_ranking, new_ranking)

    return {
        "status": "proposed",
        "current_formula": state.get("rubric_formula", ""),
        "proposed_formula": new_formula,
        "weight_changes": {
            dim: {
                "old": state.get("rubric_dimensions", {}).get(dim, {}).get("weight", 1.0),
                "new": new_weights.get(dim, 1.0),
            }
            for dim in DIMENSIONS
            if new_weights.get(dim, 1.0) != state.get("rubric_dimensions", {}).get(dim, {}).get("weight", 1.0)
        },
        "rank_consistency": consistency,
        "bias_analysis": bias,
        "threshold": 0.8,
        "passes_threshold": consistency >= 0.8,
    }


def apply_bump(new_weights: dict[str, float], new_formula: str) -> dict:
    """应用公式升级"""
    state = load_state()

    # 更新维度权重
    for dim, weight in new_weights.items():
        if dim in state.get("rubric_dimensions", {}):
            state["rubric_dimensions"][dim]["weight"] = weight

    state["rubric_formula"] = new_formula
    state["rubric_version"] = state.get("rubric_version", 1) + 1
    state["last_bump_at"] = datetime.now().isoformat()
    state["consecutive_directional_errors"] = []

    save_state(state)

    # 写入进化记录
    memo_dir = CHEAT_DIR / "rubric-memo.md"
    memo_entry = f"\n\n## v{state['rubric_version']} — {datetime.now().strftime('%Y-%m-%d')}\n"
    memo_entry += f"**新公式**: `{new_formula}`\n"
    memo_entry += f"**权重变化**:\n"
    for dim, change in _get_weight_changes(state, new_weights).items():
        memo_entry += f"- {dim}: {change['old']} → {change['new']}\n"

    with open(memo_dir, "a", encoding="utf-8") as f:
        f.write(memo_entry)

    return {
        "status": "applied",
        "new_version": state["rubric_version"],
        "new_formula": new_formula,
    }


def get_evolution_history() -> list[dict]:
    """获取公式进化历史"""
    memo_path = CHEAT_DIR / "rubric-memo.md"
    if not memo_path.exists():
        return []

    with open(memo_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 简单解析 markdown 历史
    history = []
    for section in content.split("## ")[1:]:
        lines = section.strip().split("\n")
        if lines:
            history.append({"title": lines[0], "content": "\n".join(lines[1:])})

    return history


def _get_retro_done() -> list[dict]:
    """获取所有已复盘的预测"""
    PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
    preds = []
    for fp in sorted(PREDICTIONS_DIR.glob("*.json")):
        with open(fp, "r", encoding="utf-8") as f:
            p = json.load(f)
        if p.get("retro"):
            preds.append(p)
    return preds


def _compute_ranking(dims_config: dict) -> list[str]:
    """根据权重计算维度排名"""
    weights = {dim: dims_config.get(dim, {}).get("weight", 1.0) for dim in DIMENSIONS}
    return sorted(DIMENSIONS, key=lambda d: weights[d], reverse=True)


def _rank_consistency(old: list[str], new: list[str]) -> float:
    """计算两个排名的 Spearman 一致性"""
    n = len(old)
    if n == 0:
        return 1.0
    d_sq_sum = sum((old.index(d) - new.index(d)) ** 2 for d in old)
    rho = 1 - (6 * d_sq_sum) / (n * (n ** 2 - 1))
    return round(rho, 3)


def _generate_recommendation(avg_error: float, sorted_dims: list, n: int) -> str:
    """生成进化建议"""
    if abs(avg_error) < 15:
        return "公式表现稳定，暂不需要升级"
    if n < 5:
        return f"样本量偏少（{n}个），建议积累更多数据后再判断"

    top_problem = sorted_dims[0] if sorted_dims else None
    if top_problem and abs(top_problem[1]) > 0.3:
        return f"维度 {top_problem[0]} 与误差相关性最强（r={top_problem[1]}），建议调整其权重"

    return "建议进行全面公式审查"


def _get_weight_changes(state: dict, new_weights: dict) -> dict:
    """计算权重变化"""
    changes = {}
    for dim, new_w in new_weights.items():
        old_w = state.get("rubric_dimensions", {}).get(dim, {}).get("weight", 1.0)
        if abs(new_w - old_w) > 0.01:
            changes[dim] = {"old": old_w, "new": new_w}
    return changes