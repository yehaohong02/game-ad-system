"""
Whisper 音频转文字 + 关键词提取（扩展版）

返回连续值特征：
- marketing_intensity：营销热词密度（0-1）
- has_voiceover：是否有人声
- speech_rate：语速（字符/秒）
- keyword_scores：每个命中关键词的权重
"""

# 扩展版营销热词库（带权重）
MARKETING_KEYWORDS = {
    # 促销类
    "免费": 1.0, "限时": 0.9, "首充": 0.8, "福利": 0.7,
    "折扣": 0.8, "送": 0.6, "白嫖": 0.9, "0元": 1.0,
    # 紧迫感类
    "马上": 0.7, "立即": 0.7, "最后": 0.8, "错过": 0.7,
    "仅限今天": 1.0, "倒计时": 0.8,
    # 游戏类
    "下载": 0.6, "预约": 0.5, "公测": 0.6, "新服": 0.5,
    "满级": 0.5, "VIP": 0.6, "SSR": 0.7, "100抽": 0.9,
    "登录送": 0.8, "活动": 0.4,
    # 情绪类
    "绝了": 0.6, "太强了": 0.5, "无敌": 0.5, "必看": 0.7,
}

# 旧接口兼容的热词列表（8 个）
LEGACY_HOTWORDS = ["免费", "限时", "100抽", "SSR", "登录送", "福利", "首充", "活动"]


def tag_audio(audio_path: str) -> dict:
    """
    转录音频并提取连续值特征。

    Returns:
        dict: {
            "transcript": "完整转录文本",
            "keywords": ["免费", "限时"],                    # 命中关键词（兼容旧接口）
            "keyword_scores": {"免费": 1.0, "限时": 0.9},   # 关键词 → 权重
            "marketing_intensity": 0.65,                     # 营销强度 0-1
            "has_voiceover": True,                           # 是否有人声
            "speech_rate": 3.2,                              # 语速（字符/秒）
            "text_length": 128,                              # 转录文本长度
        }
    """
    try:
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(audio_path, language="zh")
        text = result["text"]
        segments = result.get("segments", [])

        # 关键词提取（带分数）
        keyword_scores = {kw: MARKETING_KEYWORDS[kw] for kw in MARKETING_KEYWORDS if kw in text}
        keywords = list(keyword_scores.keys())

        # 营销强度
        max_possible = sum(MARKETING_KEYWORDS.values())
        marketing_intensity = sum(keyword_scores.values()) / max_possible if max_possible > 0 else 0.0

        # 语速
        total_duration = segments[-1]["end"] if segments else 0.0
        speech_rate = len(text) / total_duration if total_duration > 0 else 0.0

        return {
            "transcript": text,
            "keywords": keywords,
            "keyword_scores": keyword_scores,
            "marketing_intensity": round(marketing_intensity, 4),
            "has_voiceover": len(text) > 10,
            "speech_rate": round(speech_rate, 2),
            "text_length": len(text),
        }
    except ImportError:
        return {
            "transcript": "",
            "keywords": [],
            "keyword_scores": {},
            "marketing_intensity": 0.0,
            "has_voiceover": False,
            "speech_rate": 0.0,
            "text_length": 0,
        }


# ─── 旧接口兼容 ───
def _extract_keywords(text: str) -> list[str]:
    """旧接口：从文本中提取营销关键词"""
    return [w for w in LEGACY_HOTWORDS if w in text]