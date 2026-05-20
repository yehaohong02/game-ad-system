from src.ai.expert_base import BaseExpert


class MemoryExpert(BaseExpert):
    name = "记忆沉淀专家"
    module = "memory"
    system_prompt = """你是一个广告投放经验分析专家。
你的职责：
1. 从历史案例中提取经验
2. 总结成功和失败的模式
3. 为当前决策提供历史参考
4. 用简洁的中文回答"""
