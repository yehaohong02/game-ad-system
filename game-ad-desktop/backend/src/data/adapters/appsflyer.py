"""AppsFlyer 数据适配器"""
import httpx
from datetime import date
from src.shared.config import settings


class AppsFlyerAdapter:
    BASE_URL = "https://hq1.appsflyer.com/api/raw-data"

    def __init__(self):
        self.token = settings.appsflyer_token

    def fetch(self, target_date: date) -> list[dict]:
        url = f"{self.BASE_URL}/installs_report/v5"
        headers = {"Authorization": f"Bearer {self.token}"}
        params = {
            "from": str(target_date),
            "to": str(target_date),
        }
        resp = httpx.get(url, headers=headers, params=params, timeout=60)
        resp.raise_for_status()
        return self._transform(resp.json().get("data", []))

    def _transform(self, raw: list[dict]) -> list[dict]:
        results = []
        for row in raw:
            results.append({
                "ad_id": row.get("Adgroup ID", ""),
                "creative_id": row.get("Creative ID", ""),
                "installs": int(row.get("Installs", 0)),
                "revenue": float(row.get("Revenue", 0)),
                "country": row.get("Country Code", ""),
                "platform": row.get("Platform", ""),
            })
        return results
