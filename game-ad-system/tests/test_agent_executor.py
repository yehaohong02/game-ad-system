import pytest
from unittest.mock import patch

try:
    import langchain
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False


@pytest.mark.skipif(not LANGCHAIN_AVAILABLE, reason="langchain not installed")
def test_agent_initialization():
    with patch("langchain_openai.ChatOpenAI") as mock_llm:
        from src.execution.agent.executor import AdExecutorAgent
        agent = AdExecutorAgent()
        assert agent is not None


@pytest.mark.skipif(not LANGCHAIN_AVAILABLE, reason="langchain not installed")
def test_tools_defined():
    from src.execution.agent.executor import TOOLS
    assert len(TOOLS) == 4
    tool_names = {t.name for t in TOOLS}
    assert "create_ad_tool" in tool_names
    assert "update_bid_tool" in tool_names
    assert "pause_ad_tool" in tool_names
    assert "get_ad_stats_tool" in tool_names


def test_system_prompt_exists():
    from src.execution.agent.prompts import SYSTEM_PROMPT
    assert "游戏买量" in SYSTEM_PROMPT or "ROAS" in SYSTEM_PROMPT
    assert "思考" in SYSTEM_PROMPT or "think" in SYSTEM_PROMPT.lower()
