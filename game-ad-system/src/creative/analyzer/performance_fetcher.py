from datetime import date, timedelta
from src.shared.db.clickhouse import get_clickhouse_client


def fetch_creative_performance(target_date: date, days: int = 7) -> list[dict]:
    """从 ClickHouse 获取最近 N 天按 creative_id 聚合的表现数据"""
    client = get_clickhouse_client()
    start_date = target_date - timedelta(days=days)

    query = """
    SELECT
        creative_id,
        sum(revenue) / greatest(sum(spend), 0.01) as roas,
        sum(clicks) / greatest(sum(impressions), 0.01) as ctr,
        sum(installs) / greatest(sum(impressions), 0.01) * 1000 as ipm
    FROM ads_performance
    WHERE date >= %(start)s AND date <= %(end)s
    GROUP BY creative_id
    HAVING sum(impressions) > 100
    """

    result = client.query(query, parameters={"start": start_date, "end": target_date})

    records = []
    for row in result.result_rows:
        records.append({
            "creative_id": row[0],
            "roas": row[1],
            "ctr": row[2],
            "ipm": row[3],
        })
    return records
