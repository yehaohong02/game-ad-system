"""AI 页面分析专家 — 分析网页结构，推荐 CSS 选择器"""
import json
import logging
from src.ai.expert_base import BaseExpert

logger = logging.getLogger(__name__)


class PageAnalyzerExpert(BaseExpert):
    name = "页面分析专家"
    module = "page_analyzer"
    system_prompt = """你是一个网页结构分析专家。你的任务是分析网页的 HTML 结构，为数据提取推荐合适的 CSS 选择器。

给定一个网页的 HTML 内容，请识别以下数据字段的 CSS 选择器：
1. 列表/卡片容器的选择器（包含多条数据项的父元素）
2. 每条数据项中的：
   - 标题 (title)
   - 缩略图/图片 (thumbnail) — 提取 src 属性
   - 广告主/来源 (advertiser)
   - 数值指标 (metric_value) — 如展示量、下载量等
   - 类型标签 (type_tag) — 如视频/图片
   - 排名 (rank) — 如果是排行榜页面
   - 分数/得分 (score)

返回严格的 JSON 格式：
{
  "container": "CSS选择器",
  "item": "单个数据项的选择器",
  "fields": {
    "title": {"selector": "...", "attribute": "text"},
    "thumbnail": {"selector": "...", "attribute": "src"},
    "advertiser": {"selector": "...", "attribute": "text"},
    "metric_value": {"selector": "...", "attribute": "text"},
    "type_tag": {"selector": "...", "attribute": "text"},
    "rank": {"selector": "...", "attribute": "text"},
    "score": {"selector": "...", "attribute": "text"}
  },
  "confidence": 0.0-1.0,
  "notes": "分析说明"
}

注意：
- 选择器应该是相对于容器的，即 container 内部的选择器
- 如果某个字段无法识别，设为 null
- 优先使用语义化的选择器（class, id, data-* 属性）
- 避免使用过于脆弱的选择器（如 nth-child 链）
- 用中文回答 notes 字段"""

    def analyze_page(self, html: str, url: str) -> dict:
        """Analyze HTML and suggest CSS selectors."""
        truncated = html[:15000] if len(html) > 15000 else html
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"URL: {url}\n\nHTML 内容:\n{truncated}"},
        ]
        result = self.provider.chat(messages)
        try:
            return json.loads(result)
        except (json.JSONDecodeError, TypeError):
            return {"error": "AI 分析结果解析失败", "raw": result}
