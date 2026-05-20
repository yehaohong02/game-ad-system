from datetime import date
from src.shared.models.ad import AdPerformance


def merge_and_clean(
    meta_records: list[dict],
    af_records: list[dict],
    target_date: date,
    ad_account_id: str,
) -> list[dict]:
    """将 Meta Ads 和 AppsFlyer 数据按 (campaign_id, ad_set_id, ad_id) 左连接合并"""

    af_index = {}
    for af in af_records:
        key = (af["campaign_id"], af["ad_set_id"], af["ad_id"])
        af_index[key] = af

    merged = []
    for meta in meta_records:
        key = (meta["campaign_id"], meta["ad_set_id"], meta["ad_id"])
        af = af_index.get(key, {})

        spend = meta.get("spend", 0.0)
        revenue = af.get("revenue", 0.0)
        installs = af.get("installs", meta.get("installs", 0))
        roi = round(revenue / spend, 4) if spend > 0 else 0.0

        record = AdPerformance(
            date=target_date,
            ad_account_id=ad_account_id,
            campaign_id=meta["campaign_id"],
            ad_set_id=meta["ad_set_id"],
            ad_id=meta["ad_id"],
            creative_id=meta.get("creative_id", ""),
            country=af.get("country", ""),
            platform=af.get("platform", ""),
            impressions=meta.get("impressions", 0),
            clicks=meta.get("clicks", 0),
            spend=spend,
            installs=installs,
            revenue=revenue,
            roi=roi,
        )
        merged.append(record.model_dump())

    return merged
