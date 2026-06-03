"""评分公式引擎 — 7 维度评分 + 综合分计算 + 分桶"""

from typing import Optional

# 7 个评分维度
DIMENSIONS = ["ER", "SR", "HP", "QL", "NA", "AB", "SAT"]

DIMENSION_META = {
    "ER": {"name": "Emotional Resonance", "desc": "情感共鸣：能否触发观众情绪"},
    "SR": {"name": "Social Resonance", "desc": "社会共鸣：能否引发社交讨论"},
    "HP": {"name": "Hook Potential", "desc": "钩子潜力：前3秒能否留住观众"},
    "QL": {"name": "Quotable Lines", "desc": "金句密度：可传播的句子数量"},
    "NA": {"name": "Narrativity", "desc": "叙事性：故事线是否完整"},
    "AB": {"name": "Audience Breadth", "desc": "受众广度：覆盖面有多广"},
    "SAT": {"name": "Satire Depth", "desc": "讽刺深度：洞察力和批判性"},
}


def compute_composite(scores: dict[str, float], formula: Optional[str] = None, dimensions: Optional[dict] = None) -> float:
    """
    根据公式计算综合分。
    scores: {"ER": 3.5, "SR": 4.0, ...}  每个维度 0-5 分
    formula: 公式字符串，如 "(ER*1.5 + SR*1.5 + HP*1.5 + QL + NA + AB + SAT) / 8.5 * 2.0"
    dimensions: 维度配置（含权重）
    """
    if not dimensions:
        from .state import load_state
        state = load_state()
        dimensions = state.get("rubric_dimensions", {})

    # 计算加权和
    weighted_sum = 0.0
    total_weight = 0.0
    for dim in DIMENSIONS:
        score = scores.get(dim, 0)
        weight = dimensions.get(dim, {}).get("weight", 1.0)
        weighted_sum += score * weight
        total_weight += weight

    # 归一化到 0-10
    if total_weight > 0:
        composite = (weighted_sum / total_weight) * 2.0
    else:
        composite = 0.0

    return round(composite, 2)


def classify_bucket(composite: float, scheme: str = "ratio", boundaries: Optional[dict] = None) -> dict:
    """
    将综合分映射到桶。
    返回 {"bucket": "outperform", "label": "超均", "composite": 7.2}
    """
    if not boundaries:
        from .state import load_state
        state = load_state()
        boundaries = state.get("bucket_boundaries", {})

    for bucket, spec in boundaries.items():
        if spec["min"] <= composite < spec.get("max", 999):
            return {"bucket": bucket, "label": spec["label"], "composite": composite}

    # 默认返回最高桶
    if composite >= 10:
        last = list(boundaries.keys())[-1]
        return {"bucket": last, "label": boundaries[last]["label"], "composite": composite}

    return {"bucket": "unknown", "label": "未知", "composite": composite}


def score_material(scores: dict[str, float], state: Optional[dict] = None) -> dict:
    """
    完整评分流程：计算综合分 + 分桶 + 置信度
    scores: {"ER": 3.5, "SR": 4.0, ...}
    """
    if not state:
        from .state import load_state
        state = load_state()

    composite = compute_composite(scores, dimensions=state.get("rubric_dimensions"))
    bucket_info = classify_bucket(
        composite,
        scheme=state.get("bucket_scheme", "ratio"),
        boundaries=state.get("bucket_boundaries"),
    )

    return {
        "scores": scores,
        "composite": composite,
        "bucket": bucket_info["bucket"],
        "bucket_label": bucket_info["label"],
        "rubric_version": state.get("rubric_version", 1),
        "formula": state.get("rubric_formula", ""),
        "dimensions": {
            dim: {
                "name": DIMENSION_META[dim]["name"],
                "desc": DIMENSION_META[dim]["desc"],
                "weight": state.get("rubric_dimensions", {}).get(dim, {}).get("weight", 1.0),
                "score": scores.get(dim, 0),
            }
            for dim in DIMENSIONS
        },
    }