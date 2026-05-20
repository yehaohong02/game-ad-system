"""ClickHouse client singleton and schema initialization."""

from __future__ import annotations

import clickhouse_connect  # type: ignore[import-untyped]

from src.shared.config import get_settings

_client: clickhouse_connect.driver.Client | None = None


def get_clickhouse() -> clickhouse_connect.driver.Client:
    """Return a singleton ClickHouse client."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = clickhouse_connect.get_client(
            host=settings.clickhouse_host,
            port=settings.clickhouse_port,
            database=settings.clickhouse_database,
        )
    return _client


def init_clickhouse() -> None:
    """Create required tables if they do not exist."""
    client = get_clickhouse()

    client.command(
        """
        CREATE TABLE IF NOT EXISTS ads_performance
        (
            ad_id         String,
            campaign_id   String,
            date          Date,
            impressions   UInt64,
            clicks        UInt64,
            installs      UInt64,
            spend         Float64,
            revenue       Float64,
            cpi           Float64,
            roas          Float64,
            created_at    DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (campaign_id, date)
        """
    )

    client.command(
        """
        CREATE TABLE IF NOT EXISTS alerts
        (
            id          UUID DEFAULT generateUUIDv4(),
            level       String,
            message     String,
            metric      String,
            value       Float64,
            threshold   Float64,
            created_at  DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY created_at
        """
    )

    client.command(
        """
        CREATE TABLE IF NOT EXISTS platform_configs
        (
            id            String,
            name          String,
            url           String,
            selectors     String,
            created_at    DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY id
        """
    )

    client.command(
        """
        CREATE TABLE IF NOT EXISTS platform_scraped_data
        (
            id            UUID DEFAULT generateUUIDv4(),
            platform_id   String,
            data_type     String,
            data          String,
            scraped_at    DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (platform_id, scraped_at)
        """
    )
