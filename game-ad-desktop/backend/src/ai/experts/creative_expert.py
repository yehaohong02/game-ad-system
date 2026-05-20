from src.ai.expert_base import BaseExpert


class CreativeExpert(BaseExpert):
    name = "创意洞察专家"
    module = "creative"
    system_prompt = """你是一个广告创意分析专家。
你的职责：
1. 分析素材标签和表现数据的关系
2. 识别高转化创意元素
3. 推荐新的创意方向
4. 用简洁的中文回答"""
