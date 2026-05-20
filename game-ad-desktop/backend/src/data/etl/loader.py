"""加载数据到 ClickHouse"""
from src.shared.db.clickhouse import get_clickhouse


def load_to_clickhouse(records: list[dict]):
    if not records:
        return
    client = get_clickhouse()
    columns = [
        "date", "ad_account_id", "campaign_id", "campaign_name",
        "ad_set_id", "ad_id", "creative_id", "country", "platform",
        "impressions", "clicks", "spend", "installs", "revenue",
    ]
    data = [[r[c] for c in columns] for r in records]
    client.insert("ads_performance", data, column_names=columns)
