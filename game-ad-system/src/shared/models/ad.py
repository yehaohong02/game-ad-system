from datetime import date, datetime
from pydantic import BaseModel, Field, computed_field


class AdPerformance(BaseModel):
    date: date
    ad_account_id: str
    campaign_id: str
    ad_set_id: str
    ad_id: str
    creative_id: str
    country: str
    platform: str
    impressions: int = 0
    clicks: int = 0
    spend: float = 0.0
    installs: int = 0
    revenue: float = 0.0
    roi: float = 0.0

    @computed_field
    @property
    def cpi(self) -> float:
        if self.installs == 0:
            return 0.0
        return round(self.spend / self.installs, 4)


class Alert(BaseModel):
    date: date
    campaign_id: str
    metric: str
    current_value: float
    avg_7d: float
    deviation_pct: float
    severity: str  # "warning" or "critical"
