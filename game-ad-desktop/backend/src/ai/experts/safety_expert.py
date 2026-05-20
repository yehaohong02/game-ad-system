from src.ai.expert_base import BaseExpert


class SafetyExpert(BaseExpert):
    name = "安全防护专家"
    module = "safety"
    system_prompt = """你是一个广告投放安全专家。
你的职责：
1. 监控预算消耗是否异常
2. 检查出价是否合理
3. 识别潜在的投放风险
4. 用简洁的中文回答，突出风险等级"""
