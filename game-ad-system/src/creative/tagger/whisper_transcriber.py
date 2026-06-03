"""
Whisper 音频转录 + 关键词提取器

对视频音频进行中文转录，提取营销关键词并计算连续值特征：
- marketing_intensity：营销热词密度（0-1）
- has_voiceover：是否有人声
- speech_rate：语速（字符/秒）
"""

import re
from dataclasses import dataclass

try:
    import whisper
except ImportError:
    whisper = None


# 营销热词库（扩展版，带权重）
MARKETING_KEYWORDS: dict[str, float] = {
    # ─── 促销类 ───
    "免费": 1.0, "限时": 0.9, "首充": 0.8, "福利": 0.7,
    "折扣": 0.8, "送": 0.6, "白嫖": 0.9, "0元": 1.0,
    # ─── 紧迫感类 ───
    "马上": 0.7, "立即": 0.7, "最后": 0.8, "错过": 0.7,
    "仅限今天": 1.0, "倒计时": 0.8,
    # ─── 游戏类 ───
    "下载": 0.6, "预约": 0.5, "公测": 0.6, "新服": 0.5,
    "满级": 0.5, "VIP": 0.6, "SSR": 0.7, "100抽": 0.9,
    "登录送": 0.8, "活动": 0.4,
    # ─── 情绪类 ───
    "绝了": 0.6, "太强了": 0.5, "无敌": 0.5, "必看": 0.7,
}


@dataclass
class AudioAnalysis:
    """音频分析结果（连续值特征）"""
    text: str                          # 完整转录文本
    keywords: list[str]                # 命中的营销关键词
    keyword_scores: dict[str, float]   # 关键词 → 权重分数
    marketing_intensity: float         # 营销强度 0-1（所有关键词分数的归一化和）
    has_voiceover: bool                # 是否有人声（文本长度 > 10）
    text_length: int                   # 转录文本长度（字符数）
    speech_rate: float                 # 语速（字符/秒）


class WhisperTranscriber:
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is None:
            if whisper is None:
                raise ImportError("whisper is not installed")
            self._model = whisper.load_model(self.model_name)

    def analyze(self, video_path: str) -> AudioAnalysis:
        """
        转录音频并提取连续值特征。

        Returns:
            AudioAnalysis: text, keywords, keyword_scores, marketing_intensity,
                           has_voiceover, text_length, speech_rate
        """
        self._load_model()

        result = self._model.transcribe(video_path, language="zh")
        text = result.get("text", "")
        segments = result.get("segments", [])

        # 关键词提取（带分数）
        keyword_scores: dict[str, float] = {}
        for keyword, weight in MARKETING_KEYWORDS.items():
            if keyword in text:
                keyword_scores[keyword] = weight

        keywords = list(keyword_scores.keys())

        # 营销强度：所有命中关键词的权重之和，归一化到 0-1
        max_possible = sum(MARKETING_KEYWORDS.values())
        marketing_intensity = sum(keyword_scores.values()) / max_possible if max_possible > 0 else 0.0

        # 语速（字符/秒）
        total_duration = segments[-1]["end"] if segments else 0.0
        speech_rate = len(text) / total_duration if total_duration > 0 else 0.0

        return AudioAnalysis(
            text=text,
            keywords=keywords,
            keyword_scores=keyword_scores,
            marketing_intensity=marketing_intensity,
            has_voiceover=len(text) > 10,
            text_length=len(text),
            speech_rate=speech_rate,
        )

    # ─── 旧接口兼容 ───
    def transcribe(self, video_path: str) -> dict:
        """旧接口：返回 dict(text, keywords, segments)"""
        result = self.analyze(video_path)
        return {
            "text": result.text,
            "keywords": result.keywords,
            "segments": [],  # 旧接口不返回 segments 详情
        }

    def _extract_keywords(self, text: str, max_keywords: int = 10) -> list[str]:
        """旧接口：从文本中提取营销关键词"""
        keywords = []
        for keyword in MARKETING_KEYWORDS:
            if keyword in text:
                keywords.append(keyword)
        return keywords[:max_keywords]