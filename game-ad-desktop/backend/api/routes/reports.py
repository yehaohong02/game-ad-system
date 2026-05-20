"""Reports routes — daily / weekly reports."""

from datetime import date as dt_date

from fastapi import APIRouter, Query, HTTPException

router = APIRouter()


@router.get("/daily")
def daily_report(date: str = Query(None)):
    """返回指定日期的日报，默认昨天。"""
    from src.reports.generator import generate_daily_report

    d = None
    if date:
        try:
            d = dt_date.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date: {date}")
    return {"data": generate_daily_report(d)}


@router.get("/weekly")
def weekly_report():
    """返回最近 7 天的周报。"""
    from src.reports.generator import generate_weekly_report

    return {"data": generate_weekly_report()}
