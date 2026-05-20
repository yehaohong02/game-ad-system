"""合并 Meta 与 AppsFlyer 数据"""
from datetime import date


def merge_and_clean(
    meta_records: list[dict],
    af_records: list[dict],
    target_date: date,
    ad_account_id: str,
) -> list[dict]:
    af_map = {r["ad_id"]: r for r in af_records}
    merged = []

    for meta in meta_records:
        af = af_map.get(meta["ad_id"], {})
        merged.append({
            **meta,
            "creative_id": af.get("creative_id", meta.get("creative_id", "")),
            "installs": af.get("installs", meta.get("installs", 0)),
            "revenue": af.get("revenue", meta.get("revenue", 0.0)),
            "country": af.get("country", meta.get("country", "")),
            "platform": af.get("platform", meta.get("platform", "")),
        })
    return merged
