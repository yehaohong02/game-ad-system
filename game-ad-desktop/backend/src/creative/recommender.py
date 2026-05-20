"""创意推荐引擎"""
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
            temperature=0.5,
        )
    return _llm


def generate_creative_brief(
    top_elements: list[dict],
    target_roas: float = 0.8,
    target_country: str = "US",
) -> str:
    elements_text = "\n".join([
        f"- {e.get('country', '')}/{e.get('platform', '')}: ROAS {e.get('avg_roas', 0):.2f}, CTR {e.get('avg_ctr', 0):.2f}%"
        for e in top_elements[:5]
    ])

    prompt = f"""基于以下数据表现最好的素材元素组合，生成一份创意简报：

{elements_text}

目标市场: {target_country}
目标 ROAS: {target_roas}

请输出：
1. 推荐素材类型和时长
2. 建议包含的视觉元素
3. 推荐文案关键词
4. 预期效果"""

    try:
        result = _get_llm().invoke(prompt)
        return result.content
    except Exception as e:
        logger.warning("Creative brief generation failed: %s", e)
        return f"[创意简报生成失败: {e}]"
