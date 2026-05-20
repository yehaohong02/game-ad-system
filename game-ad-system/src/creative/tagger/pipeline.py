import json
import csv
from pathlib import Path
from datetime import datetime, timezone

import cv2

from src.creative.schemas import CreativeTags
from src.creative.tagger.clip_analyzer import ClipAnalyzer
from src.creative.tagger.whisper_transcriber import WhisperTranscriber


def run_tagging_pipeline(csv_path: str, output_dir: str) -> list[CreativeTags]:
    """执行完整打标流水线

    Args:
        csv_path: 包含 video_id, file_path 列的 CSV 文件路径
        output_dir: 标签 JSON 输出目录

    Returns:
        CreativeTags 列表
    """
    clip = ClipAnalyzer()
    whisper = WhisperTranscriber()

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    results = []

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            video_id = row["video_id"]
            file_path = row["file_path"]

            visual_tags = clip.analyze_video(file_path)
            whisper_result = whisper.transcribe(file_path)
            audio_tags = whisper_result.get("keywords", [])

            cap = cv2.VideoCapture(file_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            duration = int(frame_count / fps) if fps > 0 else 0
            cap.release()

            tags = CreativeTags(
                video_id=video_id,
                visual_tags=visual_tags,
                audio_tags=audio_tags,
                text_keywords=whisper_result.get("keywords", []),
                duration_seconds=duration,
            )

            json_path = output_path / f"{video_id}.json"
            json_path.write_text(tags.model_dump_json(indent=2), encoding="utf-8")

            results.append(tags)

    return results
