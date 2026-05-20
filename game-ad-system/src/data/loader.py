from src.shared.db.clickhouse import get_clickhouse_client

COLUMN_NAMES = [
    "date", "ad_account_id", "campaign_id", "ad_set_id", "ad_id",
    "creative_id", "country", "platform", "impressions", "clicks",
    "spend", "installs", "revenue", "roi",
]


def load_to_clickhouse(records: list[dict]) -> None:
    if not records:
        return

    client = get_clickhouse_client()
    rows = []
    for r in records:
        rows.append([r[col] for col in COLUMN_NAMES])

    client.insert("ads_performance", rows, column_names=COLUMN_NAMES)
