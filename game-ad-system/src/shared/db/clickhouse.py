import clickhouse_connect
from clickhouse_connect.driver import Client

from src.shared.config import settings

_client: Client | None = None


def get_clickhouse_client() -> Client:
    global _client
    if _client is None:
        _client = clickhouse_connect.get_client(
            host=settings.clickhouse_host,
            port=settings.clickhouse_port,
            username=settings.clickhouse_user,
            password=settings.clickhouse_password,
            database=settings.clickhouse_database,
        )
    return _client


ADS_PERFORMANCE_DDL = """
CREATE TABLE IF NOT EXISTS ads_performance (
    date Date,
    ad_account_id String,
    campaign_id String,
    ad_set_id String,
    ad_id String,
    creative_id String,
    country String,
    platform String,
    impressions UInt64,
    clicks UInt64,
    spend Float64,
    installs UInt64,
    revenue Float64,
    roi Float64
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, campaign_id, ad_set_id, ad_id);
"""

ALERTS_DDL = """
CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID DEFAULT generateUUIDv4(),
    created_at DateTime DEFAULT now(),
    date Date,
    campaign_id String,
    metric String,
    current_value Float64,
    avg_7d Float64,
    deviation_pct Float64,
    severity String
) ENGINE = MergeTree()
ORDER BY (created_at, campaign_id);
"""


def init_tables() -> None:
    client = get_clickhouse_client()
    client.command(ADS_PERFORMANCE_DDL)
    client.command(ALERTS_DDL)
