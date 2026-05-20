"""Pydantic models for ad performance and alerts."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class AdPerformance(BaseModel):
    """Single ad performance record."""

    ad_id: str
    campaign_id: str
    date: date
    impressions: int = 0
    clicks: int = 0
    installs: int = 0
    spend: float = 0.0
    revenue: float = 0.0
    cpi: float = 0.0
    roas: float = 0.0
    created_at: datetime | None = None


class Alert(BaseModel):
    """Alert record for budget or performance anomalies."""

    id: str | None = None
    level: str = "info"
    message: str = ""
    metric: str = ""
    value: float = 0.0
    threshold: float = 0.0
    created_at: datetime | None = None
