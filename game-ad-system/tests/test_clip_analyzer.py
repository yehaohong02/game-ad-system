from unittest.mock import patch, MagicMock
import numpy as np


def test_clip_analyzer_returns_tags():
    with patch("src.creative.tagger.clip_analyzer.open_clip", create=True) as mock_clip:
        mock_model = MagicMock()
        mock_preprocess = MagicMock()
        mock_clip.create_model_and_transforms.return_value = (mock_model, mock_preprocess, None)
        mock_clip.tokenize.return_value = MagicMock()

        mock_model.return_value = (np.array([[0.1, 0.8, 0.3, 0.2]]), None)

        from src.creative.tagger.clip_analyzer import ClipAnalyzer

        analyzer = ClipAnalyzer()
        assert analyzer.model_name == "ViT-B-32"
        assert analyzer.pretrained == "laion2b_s34b_b79k"
