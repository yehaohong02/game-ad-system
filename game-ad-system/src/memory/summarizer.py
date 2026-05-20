import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from src.shared.config import settings
from src.memory.schemas import CampaignCase, CampaignResult, KeyDecision

SUMMARIZE_PROMPT = """你是一个游戏买量数据分析专家。请根据以下活动数据，生成一个结构化的案例摘要。

活动ID: {campaign_id}

表现数据:
{performance_json}

请返回以下JSON格式的摘要（不要包含任何其他文字）:
{{
    "objective": "活动目标（如 ROAS >= 0.8）",
    "budget": 预算金额,
    "country": "国家代码",
    "platform": "平台（iOS/Android）",
    "creative_tags": ["素材标签1", "素材标签2"],
    "final_result": {{
        "roas": ROAS值,
        "total_installs": 总安装量,
        "total_spend": 总花费
    }},
    "key_decisions": [
        {{"day": 天数, "action": "决策描述", "reason": "原因"}}
    ],
    "lessons_learned": "经验总结"
}}
"""


def summarize_campaign(campaign_id: str, performance_data: dict) -> CampaignCase:
    """使用 LLM 从活动数据生成案例摘要"""
    llm = ChatOpenAI(
        model="gpt-4o",
        api_key=settings.openai_api_key,
        temperature=0,
    )

    prompt = ChatPromptTemplate.from_template(SUMMARIZE_PROMPT)
    chain = prompt | llm

    response = chain.invoke({
        "campaign_id": campaign_id,
        "performance_json": json.dumps(performance_data, indent=2, ensure_ascii=False),
    })

    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0]

    data = json.loads(content)

    return CampaignCase(
        campaign_id=campaign_id,
        objective=data.get("objective", ""),
        budget=data.get("budget", 0.0),
        country=data.get("country", ""),
        platform=data.get("platform", ""),
        creative_tags=data.get("creative_tags", []),
        final_result=CampaignResult(**data.get("final_result", {})),
        key_decisions=[KeyDecision(**d) for d in data.get("key_decisions", [])],
        lessons_learned=data.get("lessons_learned", ""),
    )
