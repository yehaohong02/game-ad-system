from unittest.mock import patch, MagicMock


def test_transcribe_returns_keywords():
    mock_result = {"text": "快来领取免费100抽限时福利不要错过", "segments": []}

    with patch("src.creative.tagger.whisper_transcriber.whisper") as mock_whisper:
        mock_model = MagicMock()
        mock_model.transcribe.return_value = mock_result
        mock_whisper.load_model.return_value = mock_model

        from src.creative.tagger.whisper_transcriber import WhisperTranscriber

        transcriber = WhisperTranscriber()
        result = transcriber.transcribe("fake_video.mp4")

        assert "text" in result
        assert "keywords" in result
        assert "免费100抽" in result["keywords"]
        assert "限时" in result["keywords"]
        assert "福利" in result["keywords"]


def test_extract_keywords():
    from src.creative.tagger.whisper_transcriber import WhisperTranscriber

    transcriber = WhisperTranscriber()
    keywords = transcriber._extract_keywords("快来下载免费100抽限时福利首充VIP")

    assert "免费100抽" in keywords
    assert "下载" in keywords
    assert "限时" in keywords
    assert "福利" in keywords
    assert "首充" in keywords
    assert "VIP" in keywords
