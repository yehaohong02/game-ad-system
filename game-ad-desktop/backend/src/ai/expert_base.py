"""AI 专家基类"""
import json
import logging
from abc import ABC, abstractmethod
from src.ai.model_registry import get_provider

logger = logging.getLogger(__name__)


class BaseExpert(ABC):
    name: str
    module: str
    system_prompt: str

    def __init__(self, provider_name: str = "openai"):
        self.provider = get_provider(provider_name)

    def analyze(self, data: dict) -> str:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"请分析以下数据并给出建议：\n{self._format_data(data)}"},
        ]
        return self.provider.chat(messages)

    def alert_check(self, data: dict) -> dict | None:
        messages = [
            {"role": "system", "content": self.system_prompt + "\n\n如果数据存在异常，请返回 JSON 格式的告警信息，否则返回 null。"},
            {"role": "user", "content": self._format_data(data)},
        ]
        result = self.provider.chat(messages)
        try:
            parsed = json.loads(result)
            return parsed if parsed else None
        except (json.JSONDecodeError, TypeError):
            return {"raw": result}

    def _format_data(self, data: dict) -> str:
        return json.dumps(data, ensure_ascii=False, indent=2, default=str)
