"""爬虫基类"""
from abc import ABC, abstractmethod
from datetime import date


class BaseScraper(ABC):
    @abstractmethod
    async def scrape_hot_creatives(self, game_category: str = "rpg") -> list[dict]:
        """抓取爆款素材"""
        ...

    @abstractmethod
    async def scrape_weekly_ranking(self) -> list[dict]:
        """抓取每周榜单"""
        ...

    @abstractmethod
    async def scrape_monthly_ranking(self) -> list[dict]:
        """抓取每月榜单"""
        ...
