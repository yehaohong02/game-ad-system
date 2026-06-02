"""CLIP 视觉标签"""
from PIL import Image
import io

TAG_PROMPTS = [
    "真人剧情", "游戏画面", "战斗特效", "宝箱开启", "角色展示",
    "福利展示", "搞笑场景", "对比测试", "UI界面", "卡通动画",
]

_model = None
_processor = None


def _get_model():
    global _model, _processor
    if _model is None:
        from transformers import CLIPModel, CLIPProcessor
        _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return _model, _processor


def tag_visual(image_bytes: bytes) -> list[str]:
    """使用 CLIP 对图片进行场景分类"""
    try:
        model, processor = _get_model()

        image = Image.open(io.BytesIO(image_bytes))
        inputs = processor(text=TAG_PROMPTS, images=image, return_tensors="pt", padding=True)
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]

        tags = []
        for i, prob in enumerate(probs):
            if prob.item() > 0.15:
                tags.append(TAG_PROMPTS[i])
        return tags if tags else [TAG_PROMPTS[probs.argmax().item()]]
    except ImportError:
        return ["待分析"]