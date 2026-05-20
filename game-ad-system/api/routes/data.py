from fastapi import APIRouter, Query
from datetime import date
from pydantic import BaseModel

router = APIRouter(prefix="/data", tags=["数据诊断"])


class PerformanceResponse(BaseModel):
    data: list[dict]


class AlertResponse(BaseModel):
    data: list[dict]


@router.get("/health", summary="模块健康检查")
def health():
    """检查数据诊断模块是否正常运行"""
    return {"status": "ok", "module": "data"}


@router.get("/performance", summary="获取广告表现数据", response_model=PerformanceResponse)
def get_performance(
    campaign_id: str = Query(..., description="活动ID"),
    date_from: date = Query(..., description="开始日期"),
    date_to: date = Query(..., description="结束日期"),
):
    """
    查询指定活动在时间范围内的广告表现数据

    - **campaign_id**: 活动ID
    - **date_from**: 开始日期 (YYYY-MM-DD)
    - **date_to**: 结束日期 (YYYY-MM-DD)

    Returns:
        包含 impressions, clicks, installs, spend, revenue, roi 等指标的数据列表
    """
    from src.shared.db.clickhouse import get_clickhouse_client
    client = get_clickhouse_client()
    result = client.query(
        "SELECT * FROM ads_performance WHERE campaign_id = %(cid)s AND date >= %(dfrom)s AND date <= %(dto)s",
        parameters={"cid": campaign_id, "dfrom": date_from, "dto": date_to},
    )
    return {"data": [dict(zip(result.column_names, row)) for row in result.result_rows]}


@router.get("/alerts", summary="获取告警列表", response_model=AlertResponse)
def get_alerts(
    campaign_id: str | None = Query(None, description="活动ID（可选）"),
):
    """
    获取最近的告警记录

    - **campaign_id**: 可选，按活动ID过滤

    Returns:
        包含告警类型、严重程度、触发值等信息的告警列表
    """
    from src.shared.db.clickhouse import get_clickhouse_client
    client = get_clickhouse_client()
    query = "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100"
    if campaign_id:
        query = f"SELECT * FROM alerts WHERE campaign_id = %(cid)s ORDER BY created_at DESC LIMIT 100"
        result = client.query(query, parameters={"cid": campaign_id})
    else:
        result = client.query(query)
    return {"data": [dict(zip(result.column_names, row)) for row in result.result_rows]}
