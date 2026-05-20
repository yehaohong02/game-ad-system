import json

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent

from src.shared.config import settings
from src.execution.agent.prompts import SYSTEM_PROMPT
from src.execution.tools.create_ad import create_ad as _create_ad
from src.execution.tools.update_bid import update_bid as _update_bid
from src.execution.tools.pause_ad import pause_ad as _pause_ad
from src.execution.tools.get_ad_stats import get_ad_stats as _get_ad_stats


@tool
def create_ad_tool(input_json: str) -> str:
    """创建新广告。输入JSON: {"ad_set_id":"xxx","creative_id":"xxx","headline":"标题","body_text":"正文"}"""
    params = json.loads(input_json)
    result = _create_ad(**params)
    return json.dumps(result, ensure_ascii=False)


@tool
def update_bid_tool(input_json: str) -> str:
    """更新广告出价。输入JSON: {"ad_id":"xxx","new_bid":5.0}"""
    params = json.loads(input_json)
    result = _update_bid(**params)
    return json.dumps(result, ensure_ascii=False)


@tool
def pause_ad_tool(input_json: str) -> str:
    """暂停广告。输入JSON: {"ad_id":"xxx"}"""
    params = json.loads(input_json)
    result = _pause_ad(**params)
    return json.dumps(result, ensure_ascii=False)


@tool
def get_ad_stats_tool(input_json: str) -> str:
    """查询广告数据。输入JSON: {"ad_id":"xxx","date_from":"2026-05-01","date_to":"2026-05-14"}"""
    params = json.loads(input_json)
    result = _get_ad_stats(**params)
    return json.dumps(result, ensure_ascii=False)


TOOLS = [create_ad_tool, update_bid_tool, pause_ad_tool, get_ad_stats_tool]


class AdExecutorAgent:
    def __init__(self, model_name: str = "gpt-4o"):
        self.llm = ChatOpenAI(
            model=model_name,
            api_key=settings.openai_api_key,
            temperature=0,
        )
        self.agent = create_agent(
            self.llm,
            tools=TOOLS,
            system_prompt=SYSTEM_PROMPT,
        )

    def run(self, query: str) -> str:
        result = self.agent.invoke({"messages": [("human", query)]})
        messages = result["messages"]
        return messages[-1].content
