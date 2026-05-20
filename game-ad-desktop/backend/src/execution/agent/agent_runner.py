"""Agent 执行器"""
import logging
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from src.execution.agent.prompts import SYSTEM_PROMPT
from src.execution.tools.ad_tools import AD_TOOLS
from src.execution.strategies.rule_engine import RuleEngine
from src.shared.config import settings

logger = logging.getLogger(__name__)


class AdAgentRunner:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            temperature=0,
        )
        self.rule_engine = RuleEngine()

    def run(self, query: str, context: dict = None) -> str:
        if context:
            triggered = self.rule_engine.evaluate(context)
            if triggered:
                rules_text = "\n".join([f"- {r['name']}: 建议执行 {r['action']}" for r in triggered])
                query = f"规则引擎触发以下规则：\n{rules_text}\n\n用户查询: {query}"

        memory_context = self._retrieve_memory(query)

        prompt = PromptTemplate.from_template(
            SYSTEM_PROMPT + "\n\n用户问题: {input}\n\n{agent_scratchpad}"
        )

        agent = create_react_agent(self.llm, AD_TOOLS, prompt)
        executor = AgentExecutor(agent=agent, tools=AD_TOOLS, verbose=True, max_iterations=5)

        result = executor.invoke({
            "input": query,
            "target_roas": context.get("target_roas", 0.8) if context else 0.8,
            "cpi_cap": context.get("cpi_cap", 2.5) if context else 2.5,
            "memory_context": memory_context,
        })

        return result["output"]

    def _retrieve_memory(self, query: str) -> str:
        try:
            from src.memory.retrieve import retrieve_similar
            cases = retrieve_similar(query, top_k=3)
            return "\n".join([c.get("summary", "") for c in cases]) if cases else "暂无历史经验"
        except Exception as e:
            logger.warning("Memory retrieval failed: %s", e)
            return "暂无历史经验"
