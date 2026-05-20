"""异常检测 — 环比 7 日均值"""
from datetime import date, timedelta
from src.shared.db.clickhouse import get_clickhouse


def detect_anomalies(target_date: date, threshold: float = 0.5) -> list[dict]:
    client = get_clickhouse()
    alerts = []

    for metric in ["spend", "cpi", "roi"]:
        rows = client.query(f"""
            SELECT * FROM (
                SELECT
                    campaign_id,
                    {metric} AS current_val,
                    (SELECT avg({metric}) FROM ads_performance
                     WHERE date BETWEEN '{target_date - timedelta(days=7)}' AND '{target_date - timedelta(days=1)}'
                     AND campaign_id = t.campaign_id) AS avg_7d
                FROM ads_performance t
                WHERE date = '{target_date}'
            ) sub
            WHERE avg_7d > 0
        """)

        for row in rows.result_rows:
            campaign_id, current_val, avg_7d = row
            if avg_7d == 0:
                continue
            deviation = abs(current_val - avg_7d) / avg_7d
            if deviation > threshold:
                severity = "critical" if deviation > 1.0 else "warning"
                alerts.append({
                    "alert_date": target_date,
                    "campaign_id": campaign_id,
                    "metric": metric,
                    "current_value": current_val,
                    "avg_7d": avg_7d,
                    "deviation_pct": round(deviation * 100, 1),
                    "severity": severity,
                })

    if alerts:
        columns = ["alert_date", "campaign_id", "metric", "current_value", "avg_7d", "deviation_pct", "severity"]
        data = [[a[c] for c in columns] for a in alerts]
        client.insert("alerts", data, column_names=columns)

    return alerts
