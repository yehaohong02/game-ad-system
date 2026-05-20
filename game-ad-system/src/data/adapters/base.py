from abc import ABC, abstractmethod
from datetime import date


class BaseAdapter(ABC):
    """广告平台数据适配器基类"""

    @abstractmethod
    def fetch(self, target_date: date) -> list[dict]:
        """拉取指定日期的广告数据"""
        ...

    @abstractmethod
    def transform(self, raw_data: list[dict]) -> list[dict]:
        """将原始数据转换为统一格式"""
        ...
