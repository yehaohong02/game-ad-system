"""从 ClickHouse 获取素材效果数据"""
from src.shared.db.clickhouse import get_clickhouse


def fetch_creative_performance(days: int = 7) -> list[dict]:
    client = get_clickhouse()
    rows = client.query(f"""
        SELECT
            creative_id,
            avg(roi) as avg_roas,
            avg(ctr) as avg_ctr,
            avg(cpi) as avg_cpi,
            sum(installs) as total_installs,
            sum(spend) as total_spend,
            count() as ad_count
        FROM ads_performance
        WHERE date >= today() - {days} AND creative_id != ''
        GROUP BY creative_id
        HAVING total_spend > 100
        ORDER BY avg_roas DESC
    """)
    return [dict(zip(rows.column_names, r)) for r in rows.result_rows]
