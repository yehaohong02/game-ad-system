"""
CLIP 视觉场景分析器

使用 OpenCLIP 对视频帧进行零样本场景分类。
输出全部标签的连续值 cosine similarity 分数（而非仅 top-k 标签名）。
"""

import tempfile
from dataclasses import dataclass, field

import numpy as np
from pathlib import Path

from .scene_labels import UNIFIED_SCENE_LABELS, normalize_tag


@dataclass
class FrameAnalysis:
    """单帧分析结果（保留连续值）"""
    tags: list[str]                    # top-k 标签名（兼容旧接口）
    scores: dict[str, float]           # 全部标签的 cosine similarity（连续值）
    top_k: int                         # top-k 参数


@dataclass
class VideoAnalysis:
    """视频分析结果（聚合后的连续值特征）"""
    visual_tags: list[str]             # 去重后的标签名（兼容旧接口）
    scene_scores: dict[str, float]     # 每个标签的最大相似度（连续值）
    avg_scores: dict[str, float]       # 每个标签的平均相似度（连续值）
    frame_count: int                   # 采样帧数
    duration_seconds: int              # 视频时长


class ClipAnalyzer:
    def __init__(self, model_name: str = "ViT-B-32", pretrained: str = "laion2b_s34b_b79k"):
        self.model_name = model_name
        self.pretrained = pretrained
        self._model = None
        self._preprocess = None
        self._text_features = None
        self._labels = UNIFIED_SCENE_LABELS

    def _load_model(self):
        if self._model is not None:
            return

        import open_clip
        import torch

        self._model, _, self._preprocess = open_clip.create_model_and_transforms(
            self.model_name, pretrained=self.pretrained
        )
        self._model.eval()

        tokenizer = open_clip.get_tokenizer(self.model_name)
        text_tokens = tokenizer(self._labels)
        with torch.no_grad():
            self._text_features = self._model.encode_text(text_tokens)
            self._text_features /= self._text_features.norm(dim=-1, keepdim=True)

    def analyze_frame(self, image_path: str, top_k: int = 3) -> FrameAnalysis:
        """
        分析单帧图像，返回全部标签的连续相似度分数。

        Returns:
            FrameAnalysis: tags（top-k 名称）+ scores（全部 14 个标签的 cosine similarity）
        """
        self._load_model()

        import open_clip
        import torch
        from PIL import Image

        image = Image.open(image_path).convert("RGB")
        image_tensor = self._preprocess(image).unsqueeze(0)

        with torch.no_grad():
            image_features = self._model.encode_image(image_tensor)
            image_features /= image_features.norm(dim=-1, keepdim=True)

        similarity = (image_features @ self._text_features.T).squeeze(0)

        # 保留全部标签的连续值分数
        scores = {label: float(similarity[i]) for i, label in enumerate(self._labels)}

        # 同时返回 top-k 标签名（兼容旧接口）
        top_indices = similarity.topk(min(top_k, len(self._labels))).indices.tolist()
        tags = [self._labels[i] for i in top_indices]

        return FrameAnalysis(tags=tags, scores=scores, top_k=top_k)

    def analyze_video(self, video_path: str, sample_interval: int = 5) -> VideoAnalysis:
        """
        分析视频，聚合所有帧的连续值特征。

        聚合方式：每个标签取 max（峰值信号）和 avg（平均信号），
        两者都保留，让下游模型自行选择。

        Returns:
            VideoAnalysis: visual_tags, scene_scores, avg_scores, frame_count, duration_seconds
        """
        import cv2

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration = int(total_frames / fps) if fps > 0 else 0

        all_tags: set[str] = set()
        all_scores: list[dict[str, float]] = []
        frame_count = 0
        sampled = 0

        sample_every = sample_interval * int(fps)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if sample_every > 0 and frame_count % sample_every == 0:
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                    cv2.imwrite(f.name, frame)
                    result = self.analyze_frame(f.name)
                    all_tags.update(result.tags)
                    all_scores.append(result.scores)
                    sampled += 1

            frame_count += 1

        cap.release()

        # 聚合：取每个标签的最大相似度和平均相似度
        scene_scores: dict[str, float] = {}
        avg_scores: dict[str, float] = {}
        for label in self._labels:
            values = [s.get(label, 0.0) for s in all_scores]
            scene_scores[label] = max(values) if values else 0.0
            avg_scores[label] = float(np.mean(values)) if values else 0.0

        return VideoAnalysis(
            visual_tags=list(all_tags),
            scene_scores=scene_scores,
            avg_scores=avg_scores,
            frame_count=sampled,
            duration_seconds=duration,
        )