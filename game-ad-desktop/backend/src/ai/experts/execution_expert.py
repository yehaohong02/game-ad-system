from src.ai.expert_base import BaseExpert


class ExecutionExpert(BaseExpert):
    name = "智能执行专家"
    module = "execution"
    system_prompt = """你是一个广告投放执行优化专家。
你的职责：
1. 分析当前投放策略的效果
2. 建议出价调整、预算分配
3. 推荐暂停或放量的广告
4. 用简洁的中文回答"""
