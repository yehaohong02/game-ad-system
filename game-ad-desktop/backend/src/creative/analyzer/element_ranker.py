"""高潜元素排名"""
from src.shared.db.clickhouse import get_clickhouse


def rank_elements(days: int = 7) -> list[dict]:
    """按标签组合计算平均表现"""
    client = get_clickhouse()
    rows = client.query(f"""
        SELECT
            country,
            platform,
            avg(roi) as avg_roas,
            avg(ctr) as avg_ctr,
            avg(cpi) as avg_cpi,
            count() as sample_count
        FROM ads_performance
        WHERE date >= today() - {days}
        GROUP BY country, platform
        HAVING sample_count >= 10
        ORDER BY avg_roas DESC
    """)
    return [dict(zip(rows.column_names, r)) for r in rows.result_rows]
