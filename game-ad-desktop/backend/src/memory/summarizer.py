"""LLM 生成案例摘要"""
import logging
from langchain_openai import ChatOpenAI
from src.shared.config import settings

logger = logging.getLogger(__name__)

_llm = None


def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            temperature=0.3,
        )
    return _llm


def generate_summary(case_data: dict) -> str:
    prompt = f"""请为以下广告投放案例生成一段简洁的经验总结（100字以内）：

Campaign: {case_data.get('campaign_id')}
国家: {case_data.get('country')}
平台: {case_data.get('platform')}
素材标签: {case_data.get('creative_tags')}
最终 ROAS: {case_data.get('final_result', {}).get('roas')}
关键决策: {case_data.get('key_decisions')}

总结:"""
    try:
        result = _get_llm().invoke(prompt)
        return result.content
    except Exception as e:
        logger.warning("Summary generation failed: %s", e)
        return f"[摘要生成失败: {e}]"
