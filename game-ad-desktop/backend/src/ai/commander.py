"""总指挥 Agent — 协调所有专家"""
import json
import logging
from src.ai.experts.data_expert import DataExpert
from src.ai.experts.creative_expert import CreativeExpert
from src.ai.experts.execution_expert import ExecutionExpert
from src.ai.experts.safety_expert import SafetyExpert
from src.ai.experts.memory_expert import MemoryExpert
from src.ai.experts.platform_expert import PlatformExpert
from src.ai.experts.page_analyzer import PageAnalyzerExpert

logger = logging.getLogger(__name__)


EXPERTS = {
    "data": DataExpert,
    "creative": CreativeExpert,
    "execution": ExecutionExpert,
    "safety": SafetyExpert,
    "memory": MemoryExpert,
    "platform": PlatformExpert,
    "page_analyzer": PageAnalyzerExpert,
}


class Commander:
    def dispatch(self, module: str, data: dict, action: str = "analyze") -> str:
        expert_cls = EXPERTS.get(module)
        if not expert_cls:
            return f"未知模块: {module}"
        expert = expert_cls()
        try:
            if action == "alert":
                result = expert.alert_check(data)
                return json.dumps(result, ensure_ascii=False)
            return expert.analyze(data)
        except Exception as e:
            logger.error("Expert %s failed: %s", module, e)
            return f"[专家调用失败: {e}]"

    def full_scan(self, all_data: dict) -> dict:
        results = {}
        for module, expert_cls in EXPERTS.items():
            module_data = all_data.get(module, {})
            if module_data:
                expert = expert_cls()
                try:
                    results[module] = expert.analyze(module_data)
                except Exception as e:
                    logger.error("Expert %s failed: %s", module, e)
                    results[module] = f"[专家调用失败: {e}]"
        return results
