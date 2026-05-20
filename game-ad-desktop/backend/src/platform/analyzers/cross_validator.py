"""内外部数据交叉验证"""


def cross_validate(
    platform_creatives: list[dict],
    internal_performance: list[dict],
) -> dict:
    """对比平台热门素材与内部表现数据"""
    internal_map = {r["creative_id"]: r for r in internal_performance}
    results = {
        "validated": [],    # 外部热门且内部表现好
        "opportunities": [],  # 外部热门但内部未测试
        "declining": [],     # 内部表现差但外部仍热门
    }

    for pc in platform_creatives:
        internal = internal_map.get(pc.get("creative_id"))
        if internal:
            if internal.get("avg_roas", 0) > 0.8:
                results["validated"].append({**pc, "internal_roas": internal["avg_roas"]})
            else:
                results["declining"].append({**pc, "internal_roas": internal["avg_roas"]})
        else:
            results["opportunities"].append(pc)

    return results
