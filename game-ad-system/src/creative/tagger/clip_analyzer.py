import numpy as np
from pathlib import Path


# 预定义的游戏广告场景标签候选集
SCENE_LABELS = [
    "真人讲解",
    "战斗画面",
    "宝箱奖励",
    "快节奏剪辑",
    "角色展示",
    "新手教程",
    "社交互动",
    "剧情对话",
    "UI界面操作",
    "CG动画",
]


class ClipAnalyzer:
    def __init__(self, model_name: str = "ViT-B-32", pretrained: str = "laion2b_s34b_b79k"):
        self.model_name = model_name
        self.pretrained = pretrained
        self._model = None
        self._preprocess = None
        self._text_features = None

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
        text_tokens = tokenizer(SCENE_LABELS)
        with torch.no_grad():
            self._text_features = self._model.encode_text(text_tokens)
            self._text_features /= self._text_features.norm(dim=-1, keepdim=True)

    def analyze_frame(self, image_path: str, top_k: int = 3) -> list[str]:
        """分析单帧图像，返回 top_k 个匹配标签"""
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
        top_indices = similarity.topk(top_k).indices.tolist()

        return [SCENE_LABELS[i] for i in top_indices]

    def analyze_video(self, video_path: str, sample_interval: int = 5) -> list[str]:
        """分析视频，按帧采样，合并所有标签"""
        import cv2

        cap = cv2.VideoCapture(video_path)
        all_tags = set()
        frame_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % (sample_interval * 30) == 0:
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                    cv2.imwrite(f.name, frame)
                    tags = self.analyze_frame(f.name)
                    all_tags.update(tags)

            frame_count += 1

        cap.release()
        return list(all_tags)
