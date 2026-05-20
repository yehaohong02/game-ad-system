import time
import httpx
from datetime import date

from src.shared.config import settings
from src.data.adapters.base import BaseAdapter


class MetaAdsAdapter(BaseAdapter):
    BASE_URL = "https://graph.facebook.com/v19.0"

    def __init__(self, access_token: str | None = None, ad_account_id: str | None = None):
        self.access_token = access_token or settings.meta_access_token
        self.ad_account_id = ad_account_id or settings.meta_ad_account_id

    def fetch(self, target_date: date) -> list[dict]:
        url = f"{self.BASE_URL}/{self.ad_account_id}/insights"
        params = {
            "access_token": self.access_token,
            "level": "ad",
            "time_range": f'{{"since":"{target_date}","until":"{target_date}"}}',
            "fields": "campaign_id,adset_id,ad_id,creative_id,impressions,clicks,spend,actions",
            "limit": 100,
        }

        all_records = []
        while url:
            response = self._request_with_retry(url, params)
            data = response.json()
            all_records.extend(data.get("data", []))
            url = data.get("paging", {}).get("next")
            params = {}

        return self.transform(all_records)

    def _request_with_retry(self, url: str, params: dict, max_retries: int = 3) -> httpx.Response:
        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=30) as client:
                    response = client.get(url, params=params)
                    if response.status_code == 200:
                        return response
                    if response.status_code == 429:
                        wait_time = 2 ** attempt
                        time.sleep(wait_time)
                        continue
                    response.raise_for_status()
            except httpx.HTTPStatusError:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)
        raise Exception(f"Failed after {max_retries} retries")

    def transform(self, raw_data: list[dict]) -> list[dict]:
        records = []
        for item in raw_data:
            installs = 0
            for action in item.get("actions", []):
                if action["action_type"] == "app_install":
                    installs = int(action["value"])
                    break

            records.append({
                "campaign_id": item.get("campaign_id", ""),
                "ad_set_id": item.get("adset_id", ""),
                "ad_id": item.get("ad_id", ""),
                "creative_id": item.get("creative", {}).get("id", ""),
                "impressions": int(item.get("impressions", 0)),
                "clicks": int(item.get("clicks", 0)),
                "spend": float(item.get("spend", 0)),
                "installs": installs,
            })
        return records
