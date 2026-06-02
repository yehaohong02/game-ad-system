"""ClickHouse client singleton and schema initialization."""

from __future__ import annotations

import logging
from typing import Any

import clickhouse_connect  # type: ignore[import-untyped]

from src.shared.config import get_settings

logger = logging.getLogger(__name__)

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


def is_clickhouse_available() -> bool:
    """Check if ClickHouse is reachable without raising."""
    try:
        client = get_clickhouse()
        client.command("SELECT 1")
        return True
    except Exception:
        return False


def safe_query(sql: str, parameters: dict[str, Any] | None = None) -> list[dict]:
    """Execute a ClickHouse query, returning [] if the database is unavailable."""
    try:
        client = get_clickhouse()
        rows = client.query(sql, parameters=parameters)
        return [dict(zip(rows.column_names, r)) for r in rows.result_rows]
    except Exception as e:
        logger.warning("ClickHouse query failed (returning empty): %s — %s", sql[:80], e)
        return []


def init_clickhouse() -> None:
    """Create required tables if they do not exist."""
    client = get_clickhouse()

    client.command(
        """
        CREATE TABLE IF NOT EXISTS ads_performance
        (
            ad_id            String,
            campaign_id      String,
            date             Date,
            impressions      UInt64,
            clicks           UInt64,
            installs         UInt64,
            spend            Float64,
            revenue          Float64,
            cpi              Float64,
            roas             Float64,
            created_at       DateTime DEFAULT now(),
            ad_account_id    String DEFAULT '',
            campaign_name    String DEFAULT '',
            ad_set_id        String DEFAULT '',
            creative_id      String DEFAULT '',
            country          String DEFAULT '',
            platform         String DEFAULT '',
            ctr              Float64 DEFAULT 0.0
        )
        ENGINE = MergeTree()
        ORDER BY (campaign_id, date)
        """
    )

    client.command(
        """
        CREATE TABLE IF NOT EXISTS alerts
        (
            alert_id      UUID DEFAULT generateUUIDv4(),
            alert_date    Date,
            campaign_id   String DEFAULT '',
            metric        String,
            current_value Float64 DEFAULT 0,
            avg_7d        Float64 DEFAULT 0,
            deviation_pct Float64 DEFAULT 0,
            severity      String DEFAULT 'warning',
            resolved      UInt8 DEFAULT 0,
            created_at    DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (alert_date, created_at)
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

    client.command(
        """
        CREATE TABLE IF NOT EXISTS platform_creatives
        (
            id            UUID DEFAULT generateUUIDv4(),
            platform_id   String,
            creative_id   String,
            title         String DEFAULT '',
            description   String DEFAULT '',
            image_url     String DEFAULT '',
            video_url     String DEFAULT '',
            country       String DEFAULT '',
            platform      String DEFAULT '',
            first_seen    DateTime DEFAULT now(),
            last_seen     DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (platform_id, creative_id)
        """
    )

    client.command(
        """
        CREATE TABLE IF NOT EXISTS platform_rankings
        (
            id            UUID DEFAULT generateUUIDv4(),
            platform_id   String,
            creative_id   String DEFAULT '',
            rank          UInt32,
            score         Float64 DEFAULT 0,
            metric_type   String DEFAULT '',
            country       String DEFAULT '',
            platform      String DEFAULT '',
            ranked_at     DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (platform_id, ranked_at)
        """
    )