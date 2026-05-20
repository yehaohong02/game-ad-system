import re
from fastapi import APIRouter, Query, HTTPException
from datetime import date
from src.shared.db.clickhouse import get_clickhouse

router = APIRouter()

_SAFE_ID = re.compile(r"^[a-zA-Z0-9_\-]+$")


def _validate_campaign_id(cid: str) -> str:
    if not _SAFE_ID.match(cid):
        raise HTTPException(status_code=400, detail="Invalid campaign_id")
    return cid


def _validate_date(d: str) -> str:
    try:
        date.fromisoformat(d)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date: {d}")
    return d


@router.get("/performance")
def get_performance(
    campaign_id: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
):
    client = get_clickhouse()
    where = ["1=1"]
    if campaign_id:
        where.append(f"campaign_id = '{_validate_campaign_id(campaign_id)}'")
    if date_from:
        where.append(f"date >= '{_validate_date(date_from)}'")
    if date_to:
        where.append(f"date <= '{_validate_date(date_to)}'")

    rows = client.query(f"""
        SELECT date, campaign_id, ad_id, impressions, clicks, spend, installs, revenue,
               roi, cpi, ctr, country, platform
        FROM ads_performance
        WHERE {' AND '.join(where)}
        ORDER BY date DESC
        LIMIT 1000
    """)
    return {"data": [dict(zip(rows.column_names, r)) for r in rows.result_rows]}


@router.get("/alerts")
def get_alerts(campaign_id: str = Query(None)):
    client = get_clickhouse()
    where = ["resolved = false"]
    if campaign_id:
        where.append(f"campaign_id = '{_validate_campaign_id(campaign_id)}'")

    rows = client.query(f"""
        SELECT alert_id, alert_date, campaign_id, metric, current_value, avg_7d, deviation_pct, severity
        FROM alerts
        WHERE {' AND '.join(where)}
        ORDER BY created_at DESC
        LIMIT 100
    """)
    return {"data": [dict(zip(rows.column_names, r)) for r in rows.result_rows]}
