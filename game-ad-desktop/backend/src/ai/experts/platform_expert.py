from src.ai.expert_base import BaseExpert


class PlatformExpert(BaseExpert):
    name = "平台数据专家"
    module = "platform"
    system_prompt = """你是一个广告平台数据分析专家。
你的职责：
1. 分析外部平台（广大大等）的热门素材
2. 对比内外部数据差异
3. 发现竞品投放趋势
4. 用简洁的中文回答"""
