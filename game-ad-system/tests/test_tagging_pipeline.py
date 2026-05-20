from unittest.mock import patch, MagicMock
from pathlib import Path


def test_pipeline_generates_tags(tmp_path):
    csv_file = tmp_path / "videos.csv"
    csv_file.write_text("video_id,file_path\nv_001,/fake/video.mp4\n")

    output_dir = str(tmp_path / "output")

    clip_patch = patch(
        "src.creative.tagger.pipeline.ClipAnalyzer",
        **{"return_value.analyze_video.return_value": ["战斗画面", "快节奏剪辑"]}
    )
    whisper_patch = patch(
        "src.creative.tagger.pipeline.WhisperTranscriber",
        **{"return_value.transcribe.return_value": {"text": "快来下载", "keywords": ["下载"]}}
    )

    with clip_patch, whisper_patch:
        # Also mock cv2
        with patch("src.creative.tagger.pipeline.cv2") as mock_cv2:
            mock_cap = MagicMock()
            mock_cap.get.side_effect = [30.0, 900.0]  # fps, frame_count
            mock_cv2.VideoCapture.return_value = mock_cap

            from src.creative.tagger.pipeline import run_tagging_pipeline
            results = run_tagging_pipeline(str(csv_file), output_dir)

    assert len(results) == 1
    assert results[0].video_id == "v_001"
    assert "战斗画面" in results[0].visual_tags
