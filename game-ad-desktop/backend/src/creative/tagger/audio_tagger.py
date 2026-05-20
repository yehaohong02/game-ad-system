"""Whisper 音频转文字 + 关键词提取"""


def tag_audio(audio_path: str) -> dict:
    try:
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(audio_path, language="zh")
        text = result["text"]
        keywords = _extract_keywords(text)
        return {"transcript": text, "keywords": keywords}
    except ImportError:
        return {"transcript": "", "keywords": []}


def _extract_keywords(text: str) -> list[str]:
    hotwords = ["免费", "限时", "100抽", "SSR", "登录送", "福利", "首充", "活动"]
    return [w for w in hotwords if w in text]
