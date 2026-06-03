# Phase 0 特征空间扩展方案

> 文档版本：v1.0
> 生成时间：2026-06-02
> 目标：让 Phase 0 数据验证实验有公平的验证机会，避免因特征空间不足而得出错误的 No-Go 结论

---

## 目录

- [第一部分：问题诊断](#第一部分问题诊断)
- [第二部分：CLIP 连续值保留](#第二部分clip-连续值保留)
- [第三部分：音频特征扩展](#第三部分音频特征扩展)
- [第四部分：行为特征扩展](#第四部分行为特征扩展)
- [第五部分：特征统合管道](#第五部分特征统合管道)
- [第六部分：数据管道打通](#第六部分数据管道打通)
- [第七部分：两套 CLIP 统一](#第七部分两套-clip-统一)
- [第八部分：改造后的 Phase 0 实验](#第八部分改造后的-phase-0-实验)

---

# 第一部分：问题诊断

## 1.1 当前特征空间

当前 CLIP 管线输出的特征：

```
visual_tags: ["战斗画面", "角色展示"]   ← 字符串列表，10 选 N，二值化
audio_tags:  ["免费", "限时"]           ← 营销关键词，10 选 N，二值化
text_keywords: ["下载", "首充"]         ← 同上
duration_seconds: 45                    ← 连续值，但只存不用
```

**三个致命缺陷：**

| 缺陷 | 具体表现 | 后果 |
|------|---------|------|
| 信息丢失 | CLIP 输出 cosine similarity 是 0-1 连续值，`analyze_frame()` 只返回 top-k 标签名，丢掉了相似度分数 | 无法区分"强匹配"和"弱匹配" |
| 维度太低 | 10 个视觉标签 + ~10 个音频关键词 = 最多 20 个二值特征 | 模型容量不足，NDCG 必然低 |
| 行为数据缺失 | MaterialRecord 有 play2s/play6s/play25/play50/play75/play100 等播放漏斗数据，完全没用上 | 丢失了最有预测力的信号 |

## 1.2 目标特征空间

改造后应该有 **35-45 个特征**，其中大部分是连续值：

| 特征类别 | 数量 | 类型 | 来源 |
|---------|------|------|------|
| 视觉场景（连续值） | 10 | float 0-1 | CLIP cosine similarity |
| 音频标签（连续值） | 8 | float 0-1 | Whisper 关键词匹配度 |
| 时长分桶 | 4 | 0/1 one-hot | duration_seconds |
| 播放漏斗比率 | 5 | float 0-1 | MaterialRecord |
| 投放表现 | 3 | float | MaterialRecord |
| 元素排名 | 2-5 | float | ElementRanking |
| **合计** | **32-35** | — | — |

---

# 第二部分：CLIP 连续值保留

## 2.1 当前代码问题

`game-ad-system/src/creative/tagger/clip_analyzer.py` 第 46-64 行：

```python
def analyze_frame(self, image_path: str, top_k: int = 3) -> list[str]:
    """分析单帧图像，返回 top_k 个匹配标签"""
    # ...
    similarity = (image_features @ self._text_features.T).squeeze(0)
    top_indices = similarity.topk(top_k).indices.tolist()
    return [SCENE_LABELS[i] for i in top_indices]  # ← 丢掉了 similarity 值！
```

`similarity` 是一个 10 维的 float tensor（每个值 0-1），代表每帧与 10 个场景标签的匹配程度。当前只取 top-k 的索引，**相似度分数被丢弃**。

## 2.2 改造方案

### 修改 `ClipAnalyzer`

```python
# game-ad-system/src/creative/tagger/clip_analyzer.py

import numpy as np
from pathlib import Path
from dataclasses import dataclass

SCENE_LABELS = [
    "真人讲解", "战斗画面", "宝箱奖励", "快节奏剪辑", "角色展示",
    "新手教程", "社交互动", "剧情对话", "UI界面操作", "CG动画",
]


@dataclass
class FrameAnalysis:
    """单帧分析结果（保留连续值）"""
    tags: list[str]                    # top-k 标签名（兼容旧接口）
    scores: dict[str, float]           # 全部 10 个标签的相似度分数
    top_k: int                         # top-k 参数


@dataclass
class VideoAnalysis:
    """视频分析结果（聚合后的连续值特征）"""
    visual_tags: list[str]             # 去重后的标签名（兼容旧接口）
    scene_scores: dict[str, float]     # 每个场景标签的最大相似度（连续值）
    avg_scores: dict[str, float]       # 每个场景标签的平均相似度（连续值）
    frame_count: int                   # 采样帧数
    duration_seconds: int              # 视频时长


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

    def analyze_frame(self, image_path: str, top_k: int = 3) -> FrameAnalysis:
        """分析单帧图像，返回全部标签的连续相似度分数"""
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

        # 保留全部 10 个标签的连续值
        scores = {label: float(similarity[i]) for i, label in enumerate(SCENE_LABELS)}

        # 同时返回 top-k 标签名（兼容旧接口）
        top_indices = similarity.topk(top_k).indices.tolist()
        tags = [SCENE_LABELS[i] for i in top_indices]

        return FrameAnalysis(tags=tags, scores=scores, top_k=top_k)

    def analyze_video(self, video_path: str, sample_interval: int = 5) -> VideoAnalysis:
        """分析视频，聚合所有帧的连续值特征"""
        import cv2

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = int(total_frames / fps)

        all_tags = set()
        all_scores: list[dict[str, float]] = []
        frame_count = 0
        sampled = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % (sample_interval * int(fps)) == 0:
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                    cv2.imwrite(f.name, frame)
                    result = self.analyze_frame(f.name)
                    all_tags.update(result.tags)
                    all_scores.append(result.scores)
                    sampled += 1

            frame_count += 1

        cap.release()

        # 聚合：取每个标签的最大相似度和平均相似度
        scene_scores = {}
        avg_scores = {}
        for label in SCENE_LABELS:
            values = [s[label] for s in all_scores]
            scene_scores[label] = max(values) if values else 0.0
            avg_scores[label] = sum(values) / len(values) if values else 0.0

        return VideoAnalysis(
            visual_tags=list(all_tags),
            scene_scores=scene_scores,
            avg_scores=avg_scores,
            frame_count=sampled,
            duration_seconds=duration,
        )
```

### 修改 `CreativeTags` schema

```python
# game-ad-system/src/creative/schemas.py

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class CreativeTags(BaseModel):
    video_id: str
    visual_tags: list[str] = Field(default_factory=list)

    # ═══ 新增：连续值特征 ═══
    scene_scores: dict[str, float] = Field(default_factory=dict)
    # {"战斗画面": 0.82, "角色展示": 0.71, "宝箱奖励": 0.15, ...}
    # 每个 SCENE_LABELS 对应一个 0-1 的 cosine similarity

    audio_tags: list[str] = Field(default_factory=list)
    audio_scores: dict[str, float] = Field(default_factory=dict)
    # {"免费": 1.0, "限时": 0.8, "首充": 0.0, ...}

    text_keywords: list[str] = Field(default_factory=list)
    duration_seconds: int = 0

    # ═══ 新增：时长分桶 ═══
    duration_bucket: str = ""  # "short"(<15s), "medium"(15-30s), "long"(30-60s), "extra_long"(>60s)

    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ElementRanking(BaseModel):
    tag: str
    avg_roas: float = 0.0
    avg_ctr: float = 0.0
    avg_ipm: float = 0.0
    sample_size: int = 0
```

## 2.3 关键变化

| 改造前 | 改造后 |
|--------|--------|
| `visual_tags: ["战斗画面", "角色展示"]` | `visual_tags: ["战斗画面", "角色展示"]`（兼容） |
| 无 | `scene_scores: {"战斗画面": 0.82, "角色展示": 0.71, "宝箱奖励": 0.15, ...}` |
| 10 个二值特征 | 10 个连续值特征（保留全部 10 个标签的相似度，不只是 top-k） |

**为什么取 max 而不是只取 top-k：**
- 一个素材可能在某个场景标签上偶尔出现高相似度帧（如"宝箱奖励"只在最后 3 秒出现）
- 取 max 能捕捉这种"峰值信号"，取 avg 会把它稀释掉
- 两个都保留，让模型自己选择

---

# 第三部分：音频特征扩展

## 3.1 当前问题

`whisper_transcriber.py` 只做关键词匹配（10 个营销热词），返回的是二值化的关键词列表。Whisper 的转录文本本身有更丰富的信息没被利用。

## 3.2 改造方案

### 扩展 WhisperTranscriber

```python
# game-ad-system/src/creative/tagger/whisper_transcriber.py

import re
from dataclasses import dataclass

try:
    import whisper
except ImportError:
    whisper = None


# 营销热词库（扩展版）
MARKETING_KEYWORDS = {
    # 促销类
    "免费": 1.0, "限时": 0.9, "首充": 0.8, "福利": 0.7,
    "折扣": 0.8, "送": 0.6, "白嫖": 0.9, "0元": 1.0,
    # 紧迫感类
    "马上": 0.7, "立即": 0.7, "最后": 0.8, "错过": 0.7,
    "仅限今天": 1.0, "倒计时": 0.8,
    # 游戏类
    "下载": 0.6, "预约": 0.5, "公测": 0.6, "新服": 0.5,
    "满级": 0.5, "VIP": 0.6, "SSR": 0.7, "100抽": 0.9,
    "登录送": 0.8, "活动": 0.4,
    # 情绪类
    "绝了": 0.6, "太强了": 0.5, "无敌": 0.5, "必看": 0.7,
}


@dataclass
class AudioAnalysis:
    """音频分析结果"""
    text: str                          # 完整转录文本
    keywords: list[str]                # 命中的营销关键词
    keyword_scores: dict[str, float]   # 关键词 → 权重分数
    marketing_intensity: float         # 营销强度 0-1（所有关键词分数的归一化和）
    has_voiceover: bool                # 是否有人声（文本长度 > 10）
    text_length: int                   # 转录文本长度（字符数）
    speech_rate: float                 # 语速（字符/秒）


class WhisperTranscriber:
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is None:
            if whisper is None:
                raise ImportError("whisper is not installed")
            self._model = whisper.load_model(self.model_name)

    def analyze(self, video_path: str) -> AudioAnalysis:
        """转录音频并提取连续值特征"""
        self._load_model()

        result = self._model.transcribe(video_path, language="zh")
        text = result.get("text", "")
        segments = result.get("segments", [])

        # 关键词提取（带分数）
        keyword_scores = {}
        for keyword, weight in MARKETING_KEYWORDS.items():
            if keyword in text:
                keyword_scores[keyword] = weight

        keywords = list(keyword_scores.keys())

        # 营销强度：所有命中关键词的权重之和，归一化到 0-1
        max_possible = sum(MARKETING_KEYWORDS.values())
        marketing_intensity = sum(keyword_scores.values()) / max_possible if max_possible > 0 else 0

        # 语速
        total_duration = segments[-1]["end"] if segments else 0
        speech_rate = len(text) / total_duration if total_duration > 0 else 0

        return AudioAnalysis(
            text=text,
            keywords=keywords,
            keyword_scores=keyword_scores,
            marketing_intensity=marketing_intensity,
            has_voiceover=len(text) > 10,
            text_length=len(text),
            speech_rate=speech_rate,
        )

    # 保留旧接口兼容
    def transcribe(self, video_path: str) -> dict:
        result = self.analyze(video_path)
        return {
            "text": result.text,
            "keywords": result.keywords,
            "segments": [],
        }
```

## 3.3 新增的音频特征

| 特征 | 类型 | 说明 |
|------|------|------|
| `marketing_intensity` | float 0-1 | 营销热词密度，比二值化的关键词列表更有区分度 |
| `has_voiceover` | bool | 有人声 vs 纯 BGM，对广告效果影响显著 |
| `speech_rate` | float | 语速（字符/秒），太快/太慢都影响完播率 |
| `keyword_scores` | dict | 每个关键词的权重分数，比"有/没有"更有信息量 |

---

# 第四部分：行为特征扩展

## 4.1 当前问题

`MaterialRecord` 里有完整的播放漏斗数据（play2s, play6s, play25, play50, play75, play100），但 Phase 0 实验完全没有使用这些数据。这些行为特征恰恰是最有预测力的信号。

## 4.2 从 MaterialRecord 提取的特征

```python
# game-ad-system/src/creative/feature_extractor.py

from dataclasses import dataclass


@dataclass
class BehavioralFeatures:
    """从 MaterialRecord 提取的行为特征"""

    # ═══ 播放漏斗比率（连续值 0-1）═══
    hook_rate: float          # play2s / playCount — 黄金 2 秒留存率
    mid_hook_rate: float      # play6s / playCount — 6 秒留存率
    completion_rate: float    # play100 / playCount — 完播率
    quarter_rate: float       # play25 / playCount — 25% 进度率
    half_rate: float          # play50 / playCount — 50% 进度率

    # ═══ 投放表现（连续值）═══
    ctr: float                # 点击率
    cpm: float                # 千次曝光成本
    cpc: float                # 单次点击成本

    # ═══ 播放漏斗衰减曲线（连续值）═══
    drop_2s_to_6s: float      # play6s / play2s — 2-6 秒衰减
    drop_6s_to_25: float      # play25 / play6s — 6 秒到 25% 衰减
    drop_25_to_50: float      # play50 / play25 — 25%-50% 衰减
    drop_50_to_100: float     # play100 / play50 — 50%-100% 衰减


def extract_behavioral_features(record: dict) -> BehavioralFeatures:
    """从 MaterialRecord 提取行为特征"""
    play_count = max(record.get("playCount", 0), 1)  # 避免除零

    play2s = record.get("play2s", 0)
    play6s = record.get("play6s", 0)
    play25 = record.get("play25", 0)
    play50 = record.get("play50", 0)
    play75 = record.get("play75", 0)
    play100 = record.get("play100", 0)

    hook_rate = play2s / play_count
    mid_hook_rate = play6s / play_count
    completion_rate = play100 / play_count
    quarter_rate = play25 / play_count
    half_rate = play50 / play_count

    # 衰减曲线：相邻阶段的比率
    drop_2s_to_6s = play6s / max(play2s, 1)
    drop_6s_to_25 = play25 / max(play6s, 1)
    drop_25_to_50 = play50 / max(play25, 1)
    drop_50_to_100 = play100 / max(play50, 1)

    return BehavioralFeatures(
        hook_rate=hook_rate,
        mid_hook_rate=mid_hook_rate,
        completion_rate=completion_rate,
        quarter_rate=quarter_rate,
        half_rate=half_rate,
        ctr=record.get("ctr", 0),
        cpm=record.get("cpm", 0),
        cpc=record.get("cpc", 0),
        drop_2s_to_6s=drop_2s_to_6s,
        drop_6s_to_25=drop_6s_to_25,
        drop_25_to_50=drop_25_to_50,
        drop_50_to_100=drop_50_to_100,
    )
```

## 4.3 为什么这些特征有预测力

| 特征 | 预测逻辑 |
|------|---------|
| `hook_rate` (play2s/playCount) | 黄金 2 秒留存率高 → 开场强 → ROAS 可能高 |
| `completion_rate` (play100/playCount) | 完播率高 → 内容有吸引力 → 转化可能高 |
| `drop_2s_to_6s` | 衰减慢 → 内容节奏好 → 用户不跳过 |
| `drop_50_to_100` | 后半段衰减慢 → 结尾有 CTA 或高潮 → 转化好 |
| `ctr` | 直接衡量广告吸引力 |
| `cpc` | 低 CPC → 素材效率高 |

**关键洞察**：这些特征是**素材级别的实际投放数据**，不是标签推断。它们比 CLIP 标签更直接地反映了素材的商业价值。Phase 0 应该同时使用标签特征和行为特征，才能公平地评估"标签的增量预测力"。

---

# 第五部分：特征统合管道

## 5.1 特征矩阵构建

```python
# game-ad-system/src/creative/feature_matrix.py

import numpy as np
from dataclasses import dataclass


# 特征名称定义（固定顺序，保证一致性）
FEATURE_NAMES = [
    # ─── 视觉特征（10 个连续值）───
    "scene_真人讲解", "scene_战斗画面", "scene_宝箱奖励", "scene_快节奏剪辑",
    "scene_角色展示", "scene_新手教程", "scene_社交互动", "scene_剧情对话",
    "scene_UI界面操作", "scene_CG动画",

    # ─── 音频特征（4 个）───
    "audio_marketing_intensity", "audio_has_voiceover",
    "audio_speech_rate", "audio_text_length_norm",

    # ─── 时长特征（4 个 one-hot）───
    "dur_short", "dur_medium", "dur_long", "dur_extra_long",

    # ─── 行为特征（12 个）───
    "behav_hook_rate", "behav_mid_hook_rate", "behav_completion_rate",
    "behav_quarter_rate", "behav_half_rate",
    "behav_ctr", "behav_cpm_norm", "behav_cpc_norm",
    "behav_drop_2s_6s", "behav_drop_6s_25",
    "behav_drop_25_50", "behav_drop_50_100",
]

NUM_FEATURES = len(FEATURE_NAMES)  # 30


@dataclass
class FeatureVector:
    """单个素材的特征向量"""
    material_id: str
    features: dict[str, float]
    roas: float | None  # 目标变量（Phase 0 验证用）


def build_feature_vector(
    creative_tags: dict,
    behavioral: dict,
    material_id: str,
    roas: float | None = None,
) -> FeatureVector:
    """从 CreativeTags + BehavioralFeatures 构建特征向量"""

    features = {}

    # ─── 视觉特征：直接用 scene_scores（连续值）───
    scene_scores = creative_tags.get("scene_scores", {})
    for label in [
        "真人讲解", "战斗画面", "宝箱奖励", "快节奏剪辑", "角色展示",
        "新手教程", "社交互动", "剧情对话", "UI界面操作", "CG动画",
    ]:
        features[f"scene_{label}"] = scene_scores.get(label, 0.0)

    # ─── 音频特征 ───
    audio_scores = creative_tags.get("audio_scores", {})
    features["audio_marketing_intensity"] = sum(audio_scores.values()) / max(len(audio_scores), 1)
    features["audio_has_voiceover"] = 1.0 if creative_tags.get("text_length", 0) > 10 else 0.0
    features["audio_speech_rate"] = min(creative_tags.get("speech_rate", 0) / 10.0, 1.0)  # 归一化
    features["audio_text_length_norm"] = min(creative_tags.get("text_length", 0) / 500.0, 1.0)

    # ─── 时长特征（one-hot）───
    duration = creative_tags.get("duration_seconds", 0)
    features["dur_short"] = 1.0 if duration < 15 else 0.0
    features["dur_medium"] = 1.0 if 15 <= duration < 30 else 0.0
    features["dur_long"] = 1.0 if 30 <= duration < 60 else 0.0
    features["dur_extra_long"] = 1.0 if duration >= 60 else 0.0

    # ─── 行为特征 ───
    play_count = max(behavioral.get("playCount", 0), 1)
    features["behav_hook_rate"] = behavioral.get("play2s", 0) / play_count
    features["behav_mid_hook_rate"] = behavioral.get("play6s", 0) / play_count
    features["behav_completion_rate"] = behavioral.get("play100", 0) / play_count
    features["behav_quarter_rate"] = behavioral.get("play25", 0) / play_count
    features["behav_half_rate"] = behavioral.get("play50", 0) / play_count
    features["behav_ctr"] = behavioral.get("ctr", 0)
    features["behav_cpm_norm"] = min(behavioral.get("cpm", 0) / 100.0, 1.0)  # 归一化
    features["behav_cpc_norm"] = min(behavioral.get("cpc", 0) / 10.0, 1.0)
    features["behav_drop_2s_6s"] = behavioral.get("play6s", 0) / max(behavioral.get("play2s", 1), 1)
    features["behav_drop_6s_25"] = behavioral.get("play25", 0) / max(behavioral.get("play6s", 1), 1)
    features["behav_drop_25_50"] = behavioral.get("play50", 0) / max(behavioral.get("play25", 1), 1)
    features["behav_drop_50_100"] = behavioral.get("play100", 0) / max(behavioral.get("play50", 1), 1)

    return FeatureVector(
        material_id=material_id,
        features=features,
        roas=roas,
    )


def build_feature_matrix(vectors: list[FeatureVector]) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """
    构建特征矩阵

    Returns:
        X: (n_samples, 30) 特征矩阵
        y: (n_samples,) ROAS 目标值
        ids: (n_samples,) 素材 ID
    """
    X = np.array([[v.features.get(f, 0.0) for f in FEATURE_NAMES] for v in vectors])
    y = np.array([v.roas for v in vectors if v.roas is not None])
    ids = [v.material_id for v in vectors]
    return X, y, ids
```

## 5.2 特征矩阵示意

```
素材 A 的特征向量（30 维）：

视觉:  [0.12, 0.82, 0.15, 0.45, 0.71, 0.08, 0.22, 0.33, 0.11, 0.05]
        真人   战斗   宝箱   快节   角色   新手   社交   剧情   UI    CG

音频:  [0.65,  1.0,  0.42, 0.30]
        营销   有声   语速   文本

时长:  [0.0,   0.0,  1.0,  0.0]
        短     中     长    超长

行为:  [0.85, 0.62, 0.08, 0.15, 0.10, 0.012, 0.35, 0.28, 0.73, 0.55, 0.67, 0.80]
        钩子   6秒   完播   25%   50%   CTR    CPM   CPC   2→6   6→25  25→50 50→100
```

---

# 第六部分：数据管道打通

## 6.1 当前问题

`MaterialRecord`（前端 localStorage）和 `CreativeTags`（后端 JSON 文件）之间**没有关联键**。

- MaterialRecord 有 `materialId`
- CreativeTags 有 `video_id`
- 两者之间没有 join 条件

## 6.2 打通方案

### 方案：在 MaterialRecord 中增加 `videoId` 字段

```typescript
// game-ad-desktop/frontend/src/stores/materialData.ts

export interface MaterialRecord {
  key: string;
  materialId: string;
  videoId?: string;    // ← 新增：关联 CreativeTags.video_id
  category: string;
  // ... 其他字段不变
}
```

### 后端：特征合并 API

```python
# game-ad-system/src/api/routes/feature_merge.py

from fastapi import APIRouter, Query

router = APIRouter(prefix="/features", tags=["features"])


@router.get("/merge")
async def merge_features(account_id: str = Query(...)):
    """
    合并 CreativeTags + MaterialRecord + BehavioralFeatures

    输出：每个素材的完整特征向量（30 维）
    """
    # 1. 获取 CreativeTags（从后端存储）
    creative_tags_list = await get_creative_tags(account_id)

    # 2. 获取 MaterialRecord（从 ClickHouse 或前端上传）
    material_records = await get_material_records(account_id)

    # 3. 按 videoId/materialId 关联
    tags_index = {t["video_id"]: t for t in creative_tags_list}
    merged = []

    for record in material_records:
        video_id = record.get("videoId") or record.get("materialId")
        tags = tags_index.get(video_id)

        if not tags:
            continue  # 没有标签数据的素材跳过

        # 构建特征向量
        vector = build_feature_vector(
            creative_tags=tags,
            behavioral=record,
            material_id=record["materialId"],
            roas=record.get("roas"),
        )
        merged.append(vector)

    return {
        "count": len(merged),
        "feature_names": FEATURE_NAMES,
        "vectors": [
            {"material_id": v.material_id, "features": v.features, "roas": v.roas}
            for v in merged
        ],
    }
```

---

# 第七部分：两套 CLIP 统一

## 7.1 当前问题

项目中有两套独立的 CLIP 实现，使用不同的模型和标签集：

| | game-ad-system | game-ad-desktop |
|---|---|---|
| 模型 | OpenCLIP ViT-B-32 | HuggingFace openai/clip-vit-base-patch32 |
| 标签 | 真人讲解, 战斗画面, 宝箱奖励, 快节奏剪辑, 角色展示, 新手教程, 社交互动, 剧情对话, UI界面操作, CG动画 | 真人剧情, 游戏画面, 战斗特效, 宝箱开启, 角色展示, 福利展示, 搞笑场景, 对比测试, UI界面, 卡通动画 |
| 触发方式 | 批量 CSV → 全视频分析 | 用户上传单张图片 |
| 输出 | CreativeTags JSON 文件 | API 返回 tags 数组 |

## 7.2 统一方案

### Step 1：统一标签集

取两个标签集的并集，去重合并为 **14 个标签**：

```python
# game-ad-system/src/creative/tagger/scene_labels.py（新建共享模块）

UNIFIED_SCENE_LABELS = [
    # 来自 game-ad-system（保留）
    "真人讲解",       # ≈ 真人剧情
    "战斗画面",       # ≈ 战斗特效
    "宝箱奖励",       # ≈ 宝箱开启
    "快节奏剪辑",
    "角色展示",       # 两边一致
    "新手教程",
    "社交互动",
    "剧情对话",
    "UI界面操作",     # ≈ UI界面
    "CG动画",         # ≈ 卡通动画

    # 来自 game-ad-desktop（新增）
    "游戏画面",       # game-ad-system 没有的
    "福利展示",
    "搞笑场景",
    "对比测试",
]

# 标签别名映射（用于匹配两套系统的不同命名）
TAG_ALIASES = {
    "真人剧情": "真人讲解",
    "战斗特效": "战斗画面",
    "宝箱开启": "宝箱奖励",
    "UI界面": "UI界面操作",
    "卡通动画": "CG动画",
}


def normalize_tag(tag: str) -> str:
    """将标签名统一为标准名"""
    return TAG_ALIASES.get(tag, tag)
```

### Step 2：统一模型

建议统一使用 **OpenCLIP ViT-B-32**（game-ad-system 的选择），原因：

| 维度 | OpenCLIP ViT-B-32 | HuggingFace CLIP |
|------|-------------------|------------------|
| 推理速度 | 更快（原生 PyTorch） | 稍慢（多一层封装） |
| 模型大小 | 相同 | 相同 |
| 社区支持 | OpenCLIP 更活跃 | Transformers 生态更广 |
| 与现有管线兼容 | ✅ 已集成 | 需要改 |

### Step 3：game-ad-desktop 改用 OpenCLIP

```python
# game-ad-desktop/backend/src/creative/tagger/visual_tagger.py（改造）

import sys
sys.path.insert(0, "D:/CC/game-ad-system")

from src.creative.tagger.clip_analyzer import ClipAnalyzer, FrameAnalysis
from src.creative.tagger.scene_labels import UNIFIED_SCENE_LABELS, normalize_tag

# 复用 game-ad-system 的 ClipAnalyzer
_analyzer = ClipAnalyzer()


def tag_visual(image_bytes: bytes) -> dict[str, float]:
    """
    对单张图片打标（兼容旧接口）

    Returns: {标签名: 相似度分数}（连续值）
    """
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        f.write(image_bytes)
        result = _analyzer.analyze_frame(f.name, top_k=5)

    # 返回全部标签的连续值分数
    return result.scores
```

---

# 第八部分：改造后的 Phase 0 实验

## 8.1 改造后的实验代码

```python
# game-ad-system/src/creative/experiment.py

from dataclasses import dataclass
from typing import Optional
import numpy as np
from scipy import stats
from src.creative.feature_matrix import FEATURE_NAMES, build_feature_matrix, FeatureVector


@dataclass
class PredictabilityReport:
    """排名可预测性报告"""
    spearman_rho: float
    spearman_pvalue: float
    ndcg_at_5: float
    ndcg_at_10: float
    sample_count: int
    feature_count: int
    feature_importance: dict[str, float]  # 每个特征的重要性
    recommendation: str       # 'go' / 'no-go' / 'borderline'
    details: str


class Phase0Experiment:
    """
    Phase 0 数据验证实验（改造版）

    核心变化：
    1. 特征从 10 个二值标签 → 30 个连续值特征
    2. 评估指标增加 Spearman ρ（排名相关性）
    3. 公式匹配用相似度阈值替代 set 交集
    4. t 检验改为独立样本 t 检验
    """

    # Go/No-Go 阈值（调整为更合理的值）
    SPEARMAN_GO_THRESHOLD = 0.4    # Spearman ρ > 0.4 → 有预测力
    SPEARMAN_NOGO_THRESHOLD = 0.2  # Spearman ρ < 0.2 → 无预测力
    NDCG_GO_THRESHOLD = 0.6
    MIN_SAMPLES = 30

    def __init__(self, feature_vectors: list[FeatureVector], formulas: list[dict]):
        self.vectors = [v for v in feature_vectors if v.roas is not None and v.roas > 0]
        self.formulas = formulas

    def run_full_experiment(self) -> dict:
        """运行完整实验"""
        if len(self.vectors) < self.MIN_SAMPLES:
            return {
                'status': 'insufficient_data',
                'message': f'素材数量不足（{len(self.vectors)} < {self.MIN_SAMPLES}）',
                'recommendation': 'no-go',
            }

        # Step 1: 特征重要性分析
        feature_importance = self._analyze_feature_importance()

        # Step 2: 公式命中率回测（改造版：用相似度阈值匹配）
        formula_backtests = self._backtest_formulas()

        # Step 3: 排名可预测性评估（改造版：增加 Spearman ρ）
        predictability = self._evaluate_predictability()

        # 汇总结论
        effective_formulas = [f for f in formula_backtests if f['is_significant']]

        return {
            'status': 'completed',
            'sample_count': len(self.vectors),
            'feature_importance': feature_importance,
            'formula_backtest': {
                'total_formulas': len(formula_backtests),
                'effective_formulas': len(effective_formulas),
                'results': formula_backtests,
            },
            'predictability': predictability,
            'recommendation': predictability.recommendation,
        }

    def _analyze_feature_importance(self) -> list[dict]:
        """分析每个特征对 ROAS 的预测重要性"""
        X, y, _ = build_feature_matrix(self.vectors)

        # 用 Spearman 相关系数衡量每个特征与 ROAS 的关系
        results = []
        for i, name in enumerate(FEATURE_NAMES):
            col = X[:, i]
            if np.std(col) == 0:
                continue  # 常数特征跳过
            rho, pvalue = stats.spearmanr(col, y)
            results.append({
                'feature': name,
                'spearman_rho': round(rho, 4),
                'pvalue': round(pvalue, 4),
                'is_significant': pvalue < 0.05,
            })

        results.sort(key=lambda r: abs(r['spearman_rho']), reverse=True)
        return results

    def _backtest_formulas(self) -> list[dict]:
        """回测每个公式（改造版：用相似度阈值匹配）"""
        X, y, ids = build_feature_matrix(self.vectors)

        results = []
        for formula in self.formulas:
            formula_tags = set(formula.get('tags', []))
            category_tags = set(formula.get('categories', []))
            all_tags = formula_tags | category_tags

            # 改造：用 scene_scores 的加权和作为匹配度
            matched_indices = []
            for i, v in enumerate(self.vectors):
                scene_scores = v.features
                # 计算素材与公式的匹配度
                match_score = sum(
                    scene_scores.get(f"scene_{tag}", 0.0)
                    for tag in all_tags
                    if f"scene_{tag}" in FEATURE_NAMES
                )
                # 阈值：至少有一个标签的相似度 > 0.3
                if match_score > 0.3:
                    matched_indices.append(i)

            if len(matched_indices) < 3:
                results.append({
                    'formula_id': formula['id'],
                    'formula_name': formula['name'],
                    'matched_count': len(matched_indices),
                    'is_significant': False,
                })
                continue

            matched_roas = y[matched_indices]
            unmatched_roas = np.delete(y, matched_indices)

            matched_avg = np.mean(matched_roas)
            unmatched_avg = np.mean(unmatched_roas) if len(unmatched_roas) > 0 else 0
            lift = matched_avg / unmatched_avg if unmatched_avg > 0 else 0

            # 改造：独立样本 t 检验
            if len(unmatched_roas) > 0:
                _, pvalue = stats.ttest_ind(matched_roas, unmatched_roas)
            else:
                pvalue = 1.0

            results.append({
                'formula_id': formula['id'],
                'formula_name': formula['name'],
                'matched_count': len(matched_indices),
                'matched_avg_roas': round(float(matched_avg), 4),
                'unmatched_avg_roas': round(float(unmatched_avg), 4),
                'lift': round(float(lift), 2),
                'ttest_pvalue': round(float(pvalue), 4),
                'is_significant': pvalue < 0.05 and lift > 1.0,
            })

        return results

    def _evaluate_predictability(self) -> PredictabilityReport:
        """评估排名可预测性（改造版：增加 Spearman ρ）"""
        from sklearn.linear_model import Ridge
        from sklearn.model_selection import LeaveOneOut

        X, y, _ = build_feature_matrix(self.vectors)

        if X.shape[1] == 0:
            return PredictabilityReport(
                spearman_rho=0, spearman_pvalue=1,
                ndcg_at_5=0, ndcg_at_10=0,
                sample_count=len(self.vectors), feature_count=0,
                feature_importance={},
                recommendation='no-go',
                details='没有可用的特征',
            )

        # Ridge 回归 + LOO 交叉验证
        loo = LeaveOneOut()
        predictions = np.zeros(len(y))

        for train_idx, test_idx in loo.split(X):
            model = Ridge(alpha=1.0)
            model.fit(X[train_idx], y[train_idx])
            predictions[test_idx] = model.predict(X[test_idx])

        # 改造：Spearman ρ（排名相关性）
        spearman_rho, spearman_p = stats.spearmanr(y, predictions)

        # NDCG
        ndcg_5 = self._ndcg_at_k(y, predictions, k=5)
        ndcg_10 = self._ndcg_at_k(y, predictions, k=10)

        # 推荐（改造：用 Spearman ρ 作为主要指标）
        if spearman_rho >= self.SPEARMAN_GO_THRESHOLD:
            recommendation = 'go'
            details = (
                f'Spearman ρ={spearman_rho:.3f} >= {self.SPEARMAN_GO_THRESHOLD}，'
                f'标签+行为特征有排名预测能力，建议建设闭环系统'
            )
        elif spearman_rho <= self.SPEARMAN_NOGO_THRESHOLD:
            recommendation = 'no-go'
            details = (
                f'Spearman ρ={spearman_rho:.3f} <= {self.SPEARMAN_NOGO_THRESHOLD}，'
                f'特征预测能力不足，建议转向回顾性分析'
            )
        else:
            recommendation = 'borderline'
            details = (
                f'Spearman ρ={spearman_rho:.3f} 处于灰色地带，'
                f'建议先做 Phase 1（公式健康度），观察效果后再决定'
            )

        # 特征重要性
        model_full = Ridge(alpha=1.0)
        model_full.fit(X, y)
        importance = dict(zip(FEATURE_NAMES, model_full.coef_))

        return PredictabilityReport(
            spearman_rho=round(float(spearman_rho), 4),
            spearman_pvalue=round(float(spearman_p), 4),
            ndcg_at_5=round(float(ndcg_5), 4),
            ndcg_at_10=round(float(ndcg_10), 4),
            sample_count=len(self.vectors),
            feature_count=X.shape[1],
            feature_importance=importance,
            recommendation=recommendation,
            details=details,
        )

    def _ndcg_at_k(self, y_true: np.ndarray, y_pred: np.ndarray, k: int) -> float:
        order = np.argsort(y_pred)[::-1]
        y_true_sorted = y_true[order]
        dcg = sum(y_true_sorted[i] / np.log2(i + 2) for i in range(min(k, len(y_true_sorted))))
        y_true_ideal = np.sort(y_true)[::-1]
        idcg = sum(y_true_ideal[i] / np.log2(i + 2) for i in range(min(k, len(y_true_ideal))))
        return dcg / idcg if idcg > 0 else 0
```

## 8.2 改造前后对比

| 维度 | 改造前（v3 原版） | 改造后 |
|------|-----------------|--------|
| 特征数量 | 10 个 | 30 个 |
| 特征类型 | 二值（0/1） | 连续值（0-1） |
| 视觉特征 | 10 个场景标签（有/无） | 10 个场景相似度（连续值） |
| 音频特征 | 10 个营销关键词（有/无） | 营销强度 + 语速 + 有无人声（连续值） |
| 行为特征 | 无 | 播放漏斗 5 个比率 + 衰减曲线 4 个 + 投放指标 3 个 |
| 时长特征 | 无 | 4 个 one-hot 分桶 |
| 公式匹配 | set 交集（非空即匹配） | scene_scores 加权和 > 阈值 |
| 统计方法 | ttest_1samp（有误） | ttest_ind（独立样本） |
| 核心指标 | NDCG@5 | Spearman ρ + NDCG@5 |
| Go 阈值 | NDCG@5 > 0.6 | Spearman ρ > 0.4 |
| 数据管道 | 未打通 | CreativeTags ↔ MaterialRecord 通过 videoId 关联 |
| CLIP 实现 | 两套不统一 | 统一为 OpenCLIP + 14 个标签 |

## 8.3 预期效果

| 场景 | 改造前预期 | 改造后预期 |
|------|-----------|-----------|
| 标签预测 ROAS | NDCG@5 ≈ 0.35-0.45（大概率 No-Go） | Spearman ρ ≈ 0.3-0.5（可能 Go） |
| 公式有效性 | 大部分公式"无效"（匹配太松稀释信号） | 有效公式被正确识别 |
| 特征重要性 | 无法区分（全是二值） | 可以看到哪些特征最有预测力（如 hook_rate、completion_rate） |
| 冷启动 | 无数据就无法实验 | 行为特征本身就有预测力，不需要等 CLIP 打标 |

## 8.4 仍需注意的风险

| 风险 | 应对 |
|------|------|
| 素材数量不足（< 30） | 降低 MIN_SAMPLES 到 20，接受低置信度 |
| 行为特征与 ROAS 高度共线 | 用 Ridge 回归的正则化自动处理 |
| 时长分桶边界敏感 | 用 4 个 one-hot 而非 1 个连续值，减少边界影响 |
| 特征归一化方式 | 所有特征都缩放到 0-1 区间，避免量纲差异 |

---

# 附录：实施清单

## A. 后端改动

| 文件 | 改动 | 工作量 |
|------|------|--------|
| `src/creative/tagger/clip_analyzer.py` | 返回连续值 FrameAnalysis/VideoAnalysis | 0.5 天 |
| `src/creative/tagger/scene_labels.py` | 新建共享标签集（14 个） | 0.5 天 |
| `src/creative/tagger/whisper_transcriber.py` | 返回连续值 AudioAnalysis | 0.5 天 |
| `src/creative/schemas.py` | CreativeTags 增加 scene_scores/audio_scores | 0.5 天 |
| `src/creative/feature_extractor.py` | 新建：从 MaterialRecord 提取行为特征 | 1 天 |
| `src/creative/feature_matrix.py` | 新建：特征矩阵构建 | 1 天 |
| `src/creative/experiment.py` | 重写 Phase 0 实验（用新特征） | 1.5 天 |
| `src/api/routes/feature_merge.py` | 新建：特征合并 API | 0.5 天 |
| **合计** | | **6 天** |

## B. 前端改动

| 文件 | 改动 | 工作量 |
|------|------|--------|
| `stores/materialData.ts` | MaterialRecord 增加 videoId 字段 | 0.5 天 |
| `pages/Phase0Experiment.tsx` | 更新实验结果展示（Spearman ρ、特征重要性） | 1 天 |
| **合计** | | **1.5 天** |

## C. 数据管道

| 任务 | 工作量 |
|------|--------|
| 统一 CLIP 标签集 | 0.5 天 |
| game-ad-desktop 改用 OpenCLIP | 1 天 |
| MaterialRecord ↔ CreativeTags 关联 | 1 天 |
| **合计** | **2.5 天** |

## D. 总工作量

| 部分 | 工作量 |
|------|--------|
| 后端 | 6 天 |
| 前端 | 1.5 天 |
| 数据管道 | 2.5 天 |
| **合计** | **10 天（约 2 周）** |

> 这比原版 Phase 0 的 8 天多了 2 天，但这 2 天换来的是：实验结果有统计意义，Go/No-Go 决策可信。

---

*文档完成 | 2026-06-02*