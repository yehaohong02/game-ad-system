"""
CLIP + Whisper 打标流水线

读取 CSV（video_id, file_path），对每个视频执行：
1. CLIP 视觉分析 → 连续值 scene_scores
2. Whisper 音频转录 → 连续值 marketing_intensity / speech_rate
3. 输出 CreativeTags JSON
"""

import csv
import json
from pathlib import Path

import cv2

from src.creative.schemas import CreativeTags
from src.creative.tagger.clip_analyzer import ClipAnalyzer
from src.creative.tagger.whisper_transcriber import WhisperTranscriber


def _duration_bucket(seconds: int) -> str:
    """时长分桶"""
    if seconds < 15:
        return "short"
    elif seconds < 30:
        return "medium"
    elif seconds < 60:
        return "long"
    else:
        return "extra_long"


def run_tagging_pipeline(csv_path: str, output_dir: str) -> list[CreativeTags]:
    """执行完整打标流水线（连续值版）

    Args:
        csv_path: 包含 video_id, file_path 列的 CSV 文件路径
        output_dir: 标签 JSON 输出目录

    Returns:
        CreativeTags 列表（含连续值特征）
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

            # ─── CLIP 视觉分析（连续值）───
            video_result = clip.analyze_video(file_path)

            # ─── Whisper 音频分析（连续值）───
            audio_result = whisper.analyze(file_path)

            # ─── 时长（从 CLIP 分析结果获取，避免重复读取视频）───
            duration = video_result.duration_seconds

            tags = CreativeTags(
                video_id=video_id,
                # 旧接口兼容：标签名列表
                visual_tags=video_result.visual_tags,
                audio_tags=audio_result.keywords,
                text_keywords=audio_result.keywords,
                # 新增：CLIP 连续值
                scene_scores=video_result.scene_scores,
                avg_scores=video_result.avg_scores,
                frame_count=video_result.frame_count,
                # 新增：音频连续值
                audio_scores=audio_result.keyword_scores,
                marketing_intensity=audio_result.marketing_intensity,
                has_voiceover=audio_result.has_voiceover,
                speech_rate=audio_result.speech_rate,
                text_length=audio_result.text_length,
                # 时长
                duration_seconds=duration,
                duration_bucket=_duration_bucket(duration),
            )

            json_path = output_path / f"{video_id}.json"
            json_path.write_text(tags.model_dump_json(indent=2), encoding="utf-8")

            results.append(tags)

    return results