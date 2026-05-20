"""报告生成器 — 日报 / 周报"""
from datetime import date, timedelta

from src.shared.db.clickhouse import get_clickhouse


def generate_daily_report(target_date: date = None) -> dict:
    """生成指定日期的日报数据。

    Args:
        target_date: 报告日期，默认为昨天。

    Returns:
        包含核心指标、告警摘要、Top 素材的字典。
    """
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    client = get_clickhouse()

    # 核心指标
    metrics = client.query(f"""
        SELECT
            sum(spend)       AS total_spend,
            sum(installs)    AS total_installs,
            avg(roi)         AS avg_roas,
            avg(cpi)         AS avg_cpi,
            sum(clicks) / sum(impressions) AS avg_ctr
        FROM ads_performance
        WHERE date = '{target_date}'
    """)

    # 异常告警 — 对齐 anomaly.py 写入的列名
    alerts = client.query(f"""
        SELECT
            count()                                                              AS total,
            sum(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END)             AS critical
        FROM alerts
        WHERE alert_date = '{target_date}'
    """)

    # Top 5 素材
    top_creatives = client.query(f"""
        SELECT
            creative_id,
            avg(roi)   AS roas,
            sum(spend) AS spend
        FROM ads_performance
        WHERE date = '{target_date}' AND creative_id != ''
        GROUP BY creative_id
        ORDER BY roas DESC
        LIMIT 5
    """)

    return {
        "date": str(target_date),
        "metrics": (
            dict(zip(metrics.column_names, metrics.result_rows[0]))
            if metrics.result_rows
            else {}
        ),
        "alerts": (
            dict(zip(alerts.column_names, alerts.result_rows[0]))
            if alerts.result_rows
            else {}
        ),
        "top_creatives": [
            dict(zip(top_creatives.column_names, r))
            for r in top_creatives.result_rows
        ],
    }


def generate_weekly_report() -> dict:
    """生成最近 7 天的周报摘要。"""
    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=6)

    client = get_clickhouse()

    metrics = client.query(f"""
        SELECT
            sum(spend)       AS total_spend,
            sum(installs)    AS total_installs,
            avg(roi)         AS avg_roas,
            avg(cpi)         AS avg_cpi
        FROM ads_performance
        WHERE date BETWEEN '{start_date}' AND '{end_date}'
    """)

    return {
        "period": f"{start_date} ~ {end_date}",
        "type": "weekly",
        "metrics": (
            dict(zip(metrics.column_names, metrics.result_rows[0]))
            if metrics.result_rows
            else {}
        ),
    }
