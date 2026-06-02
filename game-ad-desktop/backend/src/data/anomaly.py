"""异常检测 — 环比 7 日均值"""
from datetime import date, timedelta
from src.shared.db.clickhouse import get_clickhouse

VALID_METRICS = {"spend", "cpi", "roas"}


def detect_anomalies(target_date: date, threshold: float = 0.5) -> list[dict]:
    client = get_clickhouse()
    alerts = []

    start_7d = target_date - timedelta(days=7)
    end_1d = target_date - timedelta(days=1)

    for metric in VALID_METRICS:
        rows = client.query(
            """
            SELECT * FROM (
                SELECT
                    campaign_id,
                    {metric:String} AS current_val,
                    (SELECT avg({metric:String}) FROM ads_performance
                     WHERE date BETWEEN {start_7d:Date} AND {end_1d:Date}
                     AND campaign_id = t.campaign_id) AS avg_7d
                FROM ads_performance t
                WHERE date = {target_date:Date}
            ) sub
            WHERE avg_7d > 0
            """,
            parameters={
                "metric": metric,
                "start_7d": start_7d,
                "end_1d": end_1d,
                "target_date": target_date,
            },
        )

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