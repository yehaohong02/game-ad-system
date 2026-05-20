from pydantic import BaseModel, Field
from datetime import datetime


class CampaignResult(BaseModel):
    roas: float = 0.0
    total_installs: int = 0
    total_spend: float = 0.0


class KeyDecision(BaseModel):
    day: int
    action: str
    reason: str


class CampaignCase(BaseModel):
    campaign_id: str
    objective: str
    budget: float
    country: str
    platform: str
    creative_tags: list[str] = Field(default_factory=list)
    final_result: CampaignResult
    key_decisions: list[KeyDecision] = Field(default_factory=list)
    lessons_learned: str = ""

    def to_document(self) -> str:
        decisions_text = "\n".join(
            f"  - 第{d.day}天: {d.action}，原因: {d.reason}"
            for d in self.key_decisions
        ) or "  无关键决策记录"

        return f"""
广告活动案例: {self.campaign_id}
目标: {self.objective}
预算: ${self.budget:,.0f}
地区: {self.country}
平台: {self.platform}
素材标签: {', '.join(self.creative_tags)}

最终结果:
  - ROAS: {self.final_result.roas}
  - 总安装量: {self.final_result.total_installs}
  - 总花费: ${self.final_result.total_spend:,.0f}

关键决策:
{decisions_text}

经验总结: {self.lessons_learned}
""".strip()

    def to_metadata(self) -> dict:
        return {
            "campaign_id": self.campaign_id,
            "country": self.country,
            "platform": self.platform,
            "roas": self.final_result.roas,
            "budget": self.budget,
        }
