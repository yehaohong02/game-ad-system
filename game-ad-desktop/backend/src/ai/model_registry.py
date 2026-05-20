"""多供应商 LLM 注册中心"""
import logging
from typing import Protocol
from src.shared.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(Protocol):
    def chat(self, messages: list[dict], temperature: float = 0) -> str: ...


def _convert_messages(messages: list[dict]) -> list:
    from langchain.schema import HumanMessage, SystemMessage, AIMessage
    lc_messages = []
    for m in messages:
        if m["role"] == "system":
            lc_messages.append(SystemMessage(content=m["content"]))
        elif m["role"] == "assistant":
            lc_messages.append(AIMessage(content=m["content"]))
        else:
            lc_messages.append(HumanMessage(content=m["content"]))
    return lc_messages


class _BaseLangChainProvider:
    def __init__(self, llm):
        self.llm = llm

    def chat(self, messages: list[dict], temperature: float = 0) -> str:
        lc_messages = _convert_messages(messages)
        try:
            result = self.llm.invoke(lc_messages, config={"configurable": {"temperature": temperature}})
        except TypeError:
            result = self.llm.invoke(lc_messages)
        return result.content


class OpenAIProvider(_BaseLangChainProvider):
    def __init__(self, model: str = "gpt-4o-mini"):
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model=model, api_key=settings.openai_api_key, base_url=settings.openai_base_url)
        super().__init__(llm)


class AnthropicProvider(_BaseLangChainProvider):
    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        from langchain_anthropic import ChatAnthropic
        llm = ChatAnthropic(model=model, api_key=settings.anthropic_api_key)
        super().__init__(llm)


class DeepSeekProvider(_BaseLangChainProvider):
    def __init__(self):
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model="deepseek-chat",
            api_key=settings.deepseek_api_key,
            base_url="https://api.deepseek.com/v1",
        )
        super().__init__(llm)


class DashScopeProvider(_BaseLangChainProvider):
    def __init__(self, model: str = "qwen-plus"):
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model=model,
            api_key=settings.dashscope_api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
        super().__init__(llm)


class OllamaProvider(_BaseLangChainProvider):
    def __init__(self, model: str = "llama3"):
        from langchain_ollama import ChatOllama
        llm = ChatOllama(model=model)
        super().__init__(llm)


PROVIDERS = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "deepseek": DeepSeekProvider,
    "dashscope": DashScopeProvider,
    "ollama": OllamaProvider,
}


def get_provider(name: str = "openai", **kwargs) -> LLMProvider:
    cls = PROVIDERS.get(name)
    if not cls:
        raise ValueError(f"Unknown provider: {name}")
    return cls(**kwargs)
