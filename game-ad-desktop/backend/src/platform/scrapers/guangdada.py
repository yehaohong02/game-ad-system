"""广大大平台数据采集"""
from src.platform.scrapers.base_scraper import BaseScraper


class GuangdadaScraper(BaseScraper):
    def __init__(self, cookie: str = ""):
        self.cookie = cookie
        self.base_url = "https://www.guangdada.com"

    async def scrape_hot_creatives(self, game_category: str = "rpg") -> list[dict]:
        """通过 Electron 注入脚本抓取，这里处理数据"""
        return []  # 实际数据由 Electron 端传入

    async def scrape_weekly_ranking(self) -> list[dict]:
        return []

    async def scrape_monthly_ranking(self) -> list[dict]:
        return []

    def parse_creative_data(self, raw_html: str) -> list[dict]:
        """解析从浏览器获取的原始数据"""
        return []
