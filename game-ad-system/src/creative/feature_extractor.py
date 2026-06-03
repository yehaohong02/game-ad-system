"""
行为特征提取器

从 MaterialRecord（投放数据）中提取 12 个连续值行为特征。
这些特征是素材级别的实际投放数据，比 CLIP 标签更直接反映商业价值。
"""

from dataclasses import dataclass


@dataclass
class BehavioralFeatures:
    """从 MaterialRecord 提取的行为特征（12 个）"""

    # ─── 播放漏斗比率（5 个，连续值 0-1）───
    hook_rate: float          # play2s / playCount — 黄金 2 秒留存率
    mid_hook_rate: float      # play6s / playCount — 6 秒留存率
    completion_rate: float    # play100 / playCount — 完播率
    quarter_rate: float       # play25 / playCount — 25% 进度率
    half_rate: float          # play50 / playCount — 50% 进度率

    # ─── 投放表现（3 个，连续值）───
    ctr: float                # 点击率
    cpm: float                # 千次曝光成本（归一化后）
    cpc: float                # 单次点击成本（归一化后）

    # ─── 播放漏斗衰减曲线（4 个，连续值 0-1）───
    drop_2s_to_6s: float      # play6s / play2s — 2→6 秒衰减
    drop_6s_to_25: float      # play25 / play6s — 6 秒→25% 衰减
    drop_25_to_50: float      # play50 / play25 — 25%→50% 衰减
    drop_50_to_100: float     # play100 / play50 — 50%→100% 衰减


def extract_behavioral_features(record: dict) -> BehavioralFeatures:
    """
    从 MaterialRecord 字典提取行为特征。

    Args:
        record: 包含 playCount, play2s, play6s, play25, play50, play75, play100,
                ctr, cpm, cpc 的字典

    Returns:
        BehavioralFeatures: 12 个连续值特征
    """
    play_count = max(record.get("playCount", 0), 1)  # 避免除零

    play2s = record.get("play2s", 0)
    play6s = record.get("play6s", 0)
    play25 = record.get("play25", 0)
    play50 = record.get("play50", 0)
    play75 = record.get("play75", 0)
    play100 = record.get("play100", 0)

    # 播放漏斗比率
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
        cpm=min(record.get("cpm", 0) / 100.0, 1.0),   # 归一化
        cpc=min(record.get("cpc", 0) / 10.0, 1.0),     # 归一化
        drop_2s_to_6s=drop_2s_to_6s,
        drop_6s_to_25=drop_6s_to_25,
        drop_25_to_50=drop_25_to_50,
        drop_50_to_100=drop_50_to_100,
    )