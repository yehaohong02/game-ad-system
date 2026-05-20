import time
import httpx
from collections import defaultdict
from datetime import date

from src.shared.config import settings
from src.data.adapters.base import BaseAdapter


class AppsFlyerAdapter(BaseAdapter):
    BASE_URL = "https://hq.appsflyer.com/api/raw-data/export/app"

    def __init__(self, api_token: str | None = None, app_id: str | None = None):
        self.api_token = api_token or settings.appsflyer_api_token
        self.app_id = app_id or settings.appsflyer_app_id

    def fetch(self, target_date: date) -> list[dict]:
        url = f"{self.BASE_URL}/{self.app_id}/installs_report/v5"
        params = {
            "from": str(target_date),
            "to": str(target_date),
            "media_source": "facebook",
        }
        headers = {"Authorization": f"Bearer {self.api_token}"}

        response = self._request_with_retry(url, params, headers)
        raw = response.json().get("data", [])
        return self.transform(raw)

    def _request_with_retry(self, url: str, params: dict, headers: dict, max_retries: int = 3) -> httpx.Response:
        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=30) as client:
                    response = client.get(url, params=params, headers=headers)
                    if response.status_code == 200:
                        return response
                    if response.status_code == 429:
                        time.sleep(2 ** attempt)
                        continue
                    response.raise_for_status()
            except httpx.HTTPStatusError:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)
        raise Exception(f"Failed after {max_retries} retries")

    def transform(self, raw_data: list[dict]) -> list[dict]:
        aggregated = defaultdict(lambda: {"installs": 0, "revenue": 0.0, "country": "", "platform": ""})

        for event in raw_data:
            key = (event.get("Campaign ID", ""), event.get("Adset ID", ""), event.get("Ad ID", ""))
            agg = aggregated[key]
            agg["country"] = event.get("Country Code", "")
            agg["platform"] = event.get("Platform", "").lower()

            if event.get("Event Name") == "install":
                agg["installs"] += 1
            agg["revenue"] += float(event.get("Revenue", 0))

        records = []
        for (campaign_id, ad_set_id, ad_id), agg in aggregated.items():
            records.append({
                "campaign_id": campaign_id,
                "ad_set_id": ad_set_id,
                "ad_id": ad_id,
                "installs": agg["installs"],
                "revenue": round(agg["revenue"], 2),
                "country": agg["country"],
                "platform": agg["platform"],
            })
        return records
