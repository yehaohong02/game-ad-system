from abc import ABC, abstractmethod


class PlatformAdapter(ABC):
    """广告平台执行适配器基类"""

    @abstractmethod
    def create_ad(self, ad_set_id: str, creative_id: str, headline: str, body_text: str) -> dict:
        ...

    @abstractmethod
    def update_bid(self, ad_id: str, new_bid: float) -> dict:
        ...

    @abstractmethod
    def pause_ad(self, ad_id: str) -> dict:
        ...

    @abstractmethod
    def get_ad_stats(self, ad_id: str, date_from: str, date_to: str) -> dict:
        ...
