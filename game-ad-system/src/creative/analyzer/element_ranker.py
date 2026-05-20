from collections import defaultdict
from src.creative.schemas import ElementRanking
from src.creative.analyzer.performance_fetcher import fetch_creative_performance
from datetime import date


def rank_elements(tags_map: dict[str, list[str]], target_date: date | None = None) -> list[ElementRanking]:
    """将素材标签与表现数据关联，输出高潜元素排行榜

    Args:
        tags_map: {creative_id: [tag1, tag2, ...]}
        target_date: 分析截止日期，默认今天
    """
    if target_date is None:
        target_date = date.today()

    perf_data = fetch_creative_performance(target_date)
    perf_index = {p["creative_id"]: p for p in perf_data}

    tag_stats = defaultdict(lambda: {"roas": [], "ctr": [], "ipm": [], "count": 0})

    for creative_id, tags in tags_map.items():
        if creative_id not in perf_index:
            continue

        perf = perf_index[creative_id]
        tag_key = "+".join(sorted(set(tags)))
        stats = tag_stats[tag_key]
        stats["roas"].append(perf["roas"])
        stats["ctr"].append(perf["ctr"])
        stats["ipm"].append(perf["ipm"])
        stats["count"] += 1

    rankings = []
    for tag_key, stats in tag_stats.items():
        if stats["count"] < 3:
            continue

        rankings.append(ElementRanking(
            tag=tag_key,
            avg_roas=round(sum(stats["roas"]) / stats["count"], 2),
            avg_ctr=round(sum(stats["ctr"]) / stats["count"], 4),
            avg_ipm=round(sum(stats["ipm"]) / stats["count"], 1),
            sample_size=stats["count"],
        ))

    rankings.sort(key=lambda r: r.avg_roas, reverse=True)
    return rankings
