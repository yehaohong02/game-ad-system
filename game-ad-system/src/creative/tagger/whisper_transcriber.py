import re

try:
    import whisper
except ImportError:
    whisper = None


class WhisperTranscriber:
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is None:
            if whisper is None:
                raise ImportError("whisper is not installed")
            self._model = whisper.load_model(self.model_name)

    def transcribe(self, video_path: str) -> dict:
        """转录音频并提取关键词"""
        self._load_model()

        result = self._model.transcribe(video_path, language="zh")
        text = result.get("text", "")

        keywords = self._extract_keywords(text)

        return {
            "text": text,
            "keywords": keywords,
            "segments": result.get("segments", []),
        }

    def _extract_keywords(self, text: str, max_keywords: int = 10) -> list[str]:
        """从文本中提取营销关键词"""
        patterns = [
            r"免费\d*抽",
            r"限时",
            r"首充",
            r"福利",
            r"下载",
            r"预约",
            r"公测",
            r"新服",
            r"满级",
            r"VIP",
        ]

        keywords = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            keywords.extend(matches)

        return list(set(keywords))[:max_keywords]
