"""
创意分析 Pydantic 数据模型

CreativeTags: CLIP + Whisper 打标输出（含连续值特征）
ElementRanking: 标签组合的效果排名
"""

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class CreativeTags(BaseModel):
    """素材标签（CLIP + Whisper 输出）"""
    video_id: str
    visual_tags: list[str] = Field(default_factory=list)

    # ═══ 新增：CLIP 连续值特征 ═══
    scene_scores: dict[str, float] = Field(default_factory=dict)
    # {"战斗画面": 0.82, "角色展示": 0.71, "宝箱奖励": 0.15, ...}
    # 每个 UNIFIED_SCENE_LABELS 对应一个 0-1 的 cosine similarity

    avg_scores: dict[str, float] = Field(default_factory=dict)
    # 每个标签的平均相似度（vs scene_scores 取的是 max）

    audio_tags: list[str] = Field(default_factory=list)
    text_keywords: list[str] = Field(default_factory=list)

    # ═══ 新增：音频连续值特征 ═══
    audio_scores: dict[str, float] = Field(default_factory=dict)
    # {"免费": 1.0, "限时": 0.9, "首充": 0.0, ...} — 命中关键词的权重

    marketing_intensity: float = 0.0   # 营销热词密度 0-1
    has_voiceover: bool = False        # 是否有人声
    speech_rate: float = 0.0           # 语速（字符/秒）
    text_length: int = 0               # 转录文本长度

    duration_seconds: int = 0

    # ═══ 新增：时长分桶 ═══
    duration_bucket: str = ""          # "short" / "medium" / "long" / "extra_long"

    # ═══ 新增：视频采样帧数 ═══
    frame_count: int = 0

    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ElementRanking(BaseModel):
    """标签组合的效果排名"""
    tag: str
    avg_roas: float = 0.0
    avg_ctr: float = 0.0
    avg_ipm: float = 0.0
    sample_size: int = 0