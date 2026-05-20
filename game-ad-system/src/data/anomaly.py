from datetime import date, timedelta
from src.shared.db.clickhouse import get_clickhouse_client

ANOMALY_QUERY = """
WITH today AS (
    SELECT
        campaign_id,
        sum(spend) as spend_today,
        if(sum(installs) > 0, sum(spend) / sum(installs), 0) as cpi_today
    FROM ads_performance
    WHERE date = %(target_date)s
    GROUP BY campaign_id
),
history AS (
    SELECT
        campaign_id,
        avg(spend) as spend_avg_7d,
        if(avg(installs) > 0, avg(spend) / avg(installs), 0) as cpi_avg_7d
    FROM (
        SELECT
            campaign_id,
            sum(spend) as spend,
            sum(installs) as installs
        FROM ads_performance
        WHERE date >= %(start_date)s AND date < %(target_date)s
        GROUP BY campaign_id, date
    )
    GROUP BY campaign_id
)
SELECT
    t.campaign_id,
    multiIf(
        abs(t.spend_today - h.spend_avg_7d) / greatest(h.spend_avg_7d, 0.01) > 0.5, 'critical',
        abs(t.spend_today - h.spend_avg_7d) / greatest(h.spend_avg_7d, 0.01) > 0.3, 'warning',
        ''
    ) as spend_severity,
    t.spend_today,
    h.spend_avg_7d,
    abs(t.spend_today - h.spend_avg_7d) / greatest(h.spend_avg_7d, 0.01) * 100 as spend_deviation,
    multiIf(
        abs(t.cpi_today - h.cpi_avg_7d) / greatest(h.cpi_avg_7d, 0.01) > 0.5, 'critical',
        abs(t.cpi_today - h.cpi_avg_7d) / greatest(h.cpi_avg_7d, 0.01) > 0.3, 'warning',
        ''
    ) as cpi_severity,
    t.cpi_today,
    h.cpi_avg_7d,
    abs(t.cpi_today - h.cpi_avg_7d) / greatest(h.cpi_avg_7d, 0.01) * 100 as cpi_deviation
FROM today t
INNER JOIN history h ON t.campaign_id = h.campaign_id
WHERE spend_severity != '' OR cpi_severity != '';
"""


def detect_anomalies(target_date: date) -> list[dict]:
    client = get_clickhouse_client()

    params = {
        "target_date": target_date,
        "start_date": target_date - timedelta(days=7),
    }
    result = client.query(ANOMALY_QUERY, parameters=params)

    alerts = []
    for row in result.result_rows:
        campaign_id, spend_sev, spend_cur, spend_avg, spend_dev, cpi_sev, cpi_cur, cpi_avg, cpi_dev = row

        if spend_sev:
            alerts.append({
                "date": target_date,
                "campaign_id": campaign_id,
                "metric": "spend",
                "current_value": spend_cur,
                "avg_7d": spend_avg,
                "deviation_pct": round(spend_dev, 2),
                "severity": spend_sev,
            })
        if cpi_sev:
            alerts.append({
                "date": target_date,
                "campaign_id": campaign_id,
                "metric": "cpi",
                "current_value": cpi_cur,
                "avg_7d": cpi_avg,
                "deviation_pct": round(cpi_dev, 2),
                "severity": cpi_sev,
            })

    if alerts:
        _write_alerts(alerts)

    return alerts


def _write_alerts(alerts: list[dict]) -> None:
    client = get_clickhouse_client()
    rows = []
    for a in alerts:
        rows.append([
            a["date"], a["campaign_id"], a["metric"],
            a["current_value"], a["avg_7d"], a["deviation_pct"], a["severity"],
        ])
    client.insert(
        "alerts",
        rows,
        column_names=["date", "campaign_id", "metric", "current_value", "avg_7d", "deviation_pct", "severity"],
    )
