from datetime import datetime, timezone
from pydantic import BaseModel, Field


class CreativeTags(BaseModel):
    video_id: str
    visual_tags: list[str] = Field(default_factory=list)
    audio_tags: list[str] = Field(default_factory=list)
    text_keywords: list[str] = Field(default_factory=list)
    duration_seconds: int = 0
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ElementRanking(BaseModel):
    tag: str
    avg_roas: float = 0.0
    avg_ctr: float = 0.0
    avg_ipm: float = 0.0
    sample_size: int = 0
