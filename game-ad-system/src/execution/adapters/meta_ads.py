import httpx
from src.shared.config import settings
from src.execution.adapters.base import PlatformAdapter


class MetaExecutionAdapter(PlatformAdapter):
    BASE_URL = "https://graph.facebook.com/v19.0"

    def __init__(self, access_token: str | None = None, ad_account_id: str | None = None):
        self.access_token = access_token or settings.meta_access_token
        self.ad_account_id = ad_account_id or settings.meta_ad_account_id

    def create_ad(self, ad_set_id: str, creative_id: str, headline: str, body_text: str) -> dict:
        url = f"{self.BASE_URL}/{self.ad_account_id}/ads"
        payload = {
            "name": f"ad_{ad_set_id}_{creative_id}",
            "adset_id": ad_set_id,
            "creative": {"creative_id": creative_id},
            "status": "PAUSED",
            "access_token": self.access_token,
        }
        with httpx.Client(timeout=30) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    def update_bid(self, ad_id: str, new_bid: float) -> dict:
        url = f"{self.BASE_URL}/{ad_id}"
        payload = {
            "bid_amount": int(new_bid * 100),
            "access_token": self.access_token,
        }
        with httpx.Client(timeout=30) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    def pause_ad(self, ad_id: str) -> dict:
        url = f"{self.BASE_URL}/{ad_id}"
        payload = {
            "status": "PAUSED",
            "access_token": self.access_token,
        }
        with httpx.Client(timeout=30) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    def get_ad_stats(self, ad_id: str, date_from: str, date_to: str) -> dict:
        url = f"{self.BASE_URL}/{ad_id}/insights"
        params = {
            "access_token": self.access_token,
            "time_range": f'{{"since":"{date_from}","until":"{date_to}"}}',
            "fields": "impressions,clicks,spend,actions",
        }
        with httpx.Client(timeout=30) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            return response.json()
