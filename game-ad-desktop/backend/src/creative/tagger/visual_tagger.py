"""
CLIP 视觉标签（统一标签集 + 连续值版）

使用 HuggingFace Transformers CLIP 对图片进行场景分类。
返回全部 14 个标签的 cosine similarity 连续值分数。

关键设计：使用 sigmoid 而非 softmax，保证每个标签的分数独立（0-1），
不会因为某个标签分数高而压低其他标签的分数。
"""

import sys
import os
from PIL import Image
import io

# 导入统一标签集（保证与 game-ad-system 的 scene_labels.py 一致）
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "game-ad-system"))
from src.creative.tagger.scene_labels import UNIFIED_SCENE_LABELS, TAG_ALIASES

TAG_PROMPTS = UNIFIED_SCENE_LABELS

_model = None
_processor = None


def _get_model():
    global _model, _processor
    if _model is None:
        from transformers import CLIPModel, CLIPProcessor
        _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return _model, _processor


def tag_visual(image_bytes: bytes) -> dict:
    """
    使用 CLIP 对图片进行场景分类（连续值版）。

    返回每个标签独立的 cosine similarity 分数（sigmoid 归一化），
    而非 softmax（会强制所有分数之和为 1）。

    Returns:
        dict: {
            "tags": ["战斗画面", "角色展示"],     # 超过阈值的标签名（兼容旧接口）
            "scores": {"战斗画面": 0.82, ...},   # 全部 14 个标签的 cosine similarity（连续值）
        }
    """
    try:
        import torch
        model, processor = _get_model()

        image = Image.open(io.BytesIO(image_bytes))
        inputs = processor(text=TAG_PROMPTS, images=image, return_tensors="pt", padding=True)
        outputs = model(**inputs)

        # logits_per_image 是 cosine similarity * temperature（~100）
        # 用 sigmoid 独立归一化到 0-1，不用 softmax（softmax 强制总和为 1）
        raw_logits = outputs.logits_per_image[0]
        scores_tensor = torch.sigmoid(raw_logits)

        # 全部标签的连续值分数
        scores = {TAG_PROMPTS[i]: round(scores_tensor[i].item(), 4) for i in range(len(TAG_PROMPTS))}

        # 超过阈值的标签名（兼容旧接口，阈值调整为 0.5 适配 sigmoid）
        tags = [label for label, prob in scores.items() if prob > 0.5]
        if not tags:
            max_idx = scores_tensor.argmax().item()
            tags = [TAG_PROMPTS[max_idx]]

        return {"tags": tags, "scores": scores}
    except ImportError:
        return {"tags": ["待分析"], "scores": {label: 0.0 for label in TAG_PROMPTS}}


# ─── 旧接口兼容 ───
def tag_visual_compat(image_bytes: bytes) -> list[str]:
    """旧接口：只返回标签名列表"""
    result = tag_visual(image_bytes)
    return result["tags"]