"""
特征矩阵构建器

将 CreativeTags（标签特征）+ BehavioralFeatures（行为特征）合并为
34 维特征向量，用于 Phase 0 数据验证实验。
"""

import numpy as np
from dataclasses import dataclass

from src.creative.feature_extractor import BehavioralFeatures, extract_behavioral_features


# 特征名称定义（固定顺序，保证一致性）
# 34 个特征 = 14 视觉 + 4 音频 + 4 时长 + 12 行为
FEATURE_NAMES: list[str] = [
    # ─── 视觉特征（14 个连续值）───
    "scene_真人讲解", "scene_战斗画面", "scene_宝箱奖励", "scene_快节奏剪辑",
    "scene_角色展示", "scene_新手教程", "scene_社交互动", "scene_剧情对话",
    "scene_UI界面操作", "scene_CG动画", "scene_游戏画面", "scene_福利展示",
    "scene_搞笑场景", "scene_对比测试",

    # ─── 音频特征（4 个）───
    "audio_marketing_intensity", "audio_has_voiceover",
    "audio_speech_rate", "audio_text_length_norm",

    # ─── 时长特征（4 个 one-hot）───
    "dur_short", "dur_medium", "dur_long", "dur_extra_long",

    # ─── 行为特征（12 个）───
    "behav_hook_rate", "behav_mid_hook_rate", "behav_completion_rate",
    "behav_quarter_rate", "behav_half_rate",
    "behav_ctr", "behav_cpm_norm", "behav_cpc_norm",
    "behav_drop_2s_6s", "behav_drop_6s_25",
    "behav_drop_25_50", "behav_drop_50_100",
]

NUM_FEATURES = len(FEATURE_NAMES)  # 34

# 视觉标签列表（与 scene_scores 的 key 一致）
SCENE_LABELS = [
    "真人讲解", "战斗画面", "宝箱奖励", "快节奏剪辑", "角色展示",
    "新手教程", "社交互动", "剧情对话", "UI界面操作", "CG动画",
    "游戏画面", "福利展示", "搞笑场景", "对比测试",
]


@dataclass
class FeatureVector:
    """单个素材的特征向量"""
    material_id: str
    features: dict[str, float]
    roas: float | None  # 目标变量（Phase 0 验证用）


def build_feature_vector(
    creative_tags: dict,
    material_record: dict,
    material_id: str,
    roas: float | None = None,
) -> FeatureVector:
    """
    从 CreativeTags + MaterialRecord 构建 30 维特征向量。

    Args:
        creative_tags: CreativeTags 字典（含 scene_scores, audio_scores 等）
        material_record: MaterialRecord 字典（含 playCount, play2s 等）
        material_id: 素材 ID
        roas: 目标变量（可选）

    Returns:
        FeatureVector: 30 个特征的字典 + roas
    """
    features: dict[str, float] = {}

    # ─── 视觉特征：直接用 scene_scores（连续值）───
    scene_scores = creative_tags.get("scene_scores", {})
    for label in SCENE_LABELS:
        features[f"scene_{label}"] = scene_scores.get(label, 0.0)

    # ─── 音频特征 ───
    features["audio_marketing_intensity"] = creative_tags.get("marketing_intensity", 0.0)
    features["audio_has_voiceover"] = 1.0 if creative_tags.get("has_voiceover", False) else 0.0
    features["audio_speech_rate"] = min(creative_tags.get("speech_rate", 0.0) / 10.0, 1.0)
    features["audio_text_length_norm"] = min(creative_tags.get("text_length", 0) / 500.0, 1.0)

    # ─── 时长特征（one-hot）───
    duration = creative_tags.get("duration_seconds", 0)
    bucket = creative_tags.get("duration_bucket", "")
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
    behavioral = extract_behavioral_features(material_record)
    features["behav_hook_rate"] = behavioral.hook_rate
    features["behav_mid_hook_rate"] = behavioral.mid_hook_rate
    features["behav_completion_rate"] = behavioral.completion_rate
    features["behav_quarter_rate"] = behavioral.quarter_rate
    features["behav_half_rate"] = behavioral.half_rate
    features["behav_ctr"] = behavioral.ctr
    features["behav_cpm_norm"] = behavioral.cpm
    features["behav_cpc_norm"] = behavioral.cpc
    features["behav_drop_2s_6s"] = behavioral.drop_2s_to_6s
    features["behav_drop_6s_25"] = behavioral.drop_6s_to_25
    features["behav_drop_25_50"] = behavioral.drop_25_to_50
    features["behav_drop_50_100"] = behavioral.drop_50_to_100

    return FeatureVector(
        material_id=material_id,
        features=features,
        roas=roas,
    )


def build_feature_matrix(vectors: list[FeatureVector]) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """
    从特征向量列表构建 numpy 特征矩阵。

    Returns:
        X: (n_samples, 30) 特征矩阵
        y: (n_samples,) ROAS 目标值（无 roas 的样本被过滤）
        ids: (n_samples,) 素材 ID
    """
    # 过滤掉没有 roas 的样本
    valid = [v for v in vectors if v.roas is not None and v.roas > 0]

    X = np.array([[v.features.get(f, 0.0) for f in FEATURE_NAMES] for v in valid])
    y = np.array([v.roas for v in valid])
    ids = [v.material_id for v in valid]

    return X, y, ids