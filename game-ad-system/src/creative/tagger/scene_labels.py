"""
统一场景标签集

合并 game-ad-system（OpenCLIP）和 game-ad-desktop（HuggingFace CLIP）两套标签，
去重后形成 14 个标准标签。两套系统的标签名通过 TAG_ALIASES 统一映射。
"""

# 统一标签集（14 个）
# 来源：game-ad-system 原 10 个 + game-ad-desktop 独有的 4 个
UNIFIED_SCENE_LABELS = [
    # ─── game-ad-system 原有（10 个）───
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
    # ─── game-ad-desktop 独有，合并新增（4 个）───
    "游戏画面",
    "福利展示",
    "搞笑场景",
    "对比测试",
]

# 标签别名映射：game-ad-desktop 的命名 → 统一标准名
TAG_ALIASES = {
    "真人剧情": "真人讲解",
    "战斗特效": "战斗画面",
    "宝箱开启": "宝箱奖励",
    "UI界面": "UI界面操作",
    "卡通动画": "CG动画",
}


def normalize_tag(tag: str) -> str:
    """将非标准标签名映射为统一标准名"""
    return TAG_ALIASES.get(tag, tag)


def get_label_index() -> dict[str, int]:
    """返回标签名 → 索引的映射，用于特征矩阵构建"""
    return {label: i for i, label in enumerate(UNIFIED_SCENE_LABELS)}