"""Meta Marketing API 数据适配器"""
import httpx
from datetime import date
from src.shared.config import settings


class MetaAdsAdapter:
    BASE_URL = "https://graph.facebook.com/v19.0"

    def __init__(self):
        self.token = settings.meta_access_token
        self.account_id = settings.meta_ad_account_id

    def fetch(self, target_date: date) -> list[dict]:
        fields = "campaign_id,campaign_name,adset_id,ad_id,impressions,clicks,spend,actions"
        url = f"{self.BASE_URL}/act_{self.account_id}/insights"
        params = {
            "fields": fields,
            "time_range": f'{{"since":"{target_date}","until":"{target_date}"}}',
            "level": "ad",
            "access_token": self.token,
        }
        resp = httpx.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return self._transform(resp.json().get("data", []), target_date)

    def _transform(self, raw: list[dict], target_date: date) -> list[dict]:
        results = []
        for row in raw:
            installs = 0
            for action in row.get("actions", []):
                if action["action_type"] == "app_install":
                    installs = int(action["value"])
            results.append({
                "date": target_date,
                "ad_account_id": self.account_id,
                "campaign_id": row.get("campaign_id", ""),
                "campaign_name": row.get("campaign_name", ""),
                "ad_set_id": row.get("adset_id", ""),
                "ad_id": row.get("ad_id", ""),
                "creative_id": "",
                "country": "",
                "platform": "",
                "impressions": int(row.get("impressions", 0)),
                "clicks": int(row.get("clicks", 0)),
                "spend": float(row.get("spend", 0)),
                "installs": installs,
                "revenue": 0.0,
            })
        return results
