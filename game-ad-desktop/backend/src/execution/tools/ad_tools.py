"""Agent 可调用的广告操作工具"""
from src.shared.db.clickhouse import get_clickhouse
from src.safety.guard import guard


def get_ad_stats(ad_id: str, days: int = 7) -> dict:
    days = max(1, min(days, 90))
    ad_id = ad_id.replace("'", "")
    client = get_clickhouse()
    rows = client.query(f"""
        SELECT avg(spend) as avg_spend, avg(installs) as avg_installs,
               avg(roi) as avg_roas, avg(cpi) as avg_cpi, avg(ctr) as avg_ctr
        FROM ads_performance
        WHERE ad_id = '{ad_id}' AND date >= today() - {days}
    """)
    if rows.result_rows:
        return dict(zip(rows.column_names, rows.result_rows[0]))
    return {}


@guard.protect(operation="pause_ad")
def pause_ad(ad_id: str, **kwargs) -> dict:
    """暂停广告（需接入 Meta API）"""
    return {"action": "paused", "ad_id": ad_id}


@guard.protect(operation="update_bid")
def update_bid(ad_id: str, new_bid: float, current_bid: float, **kwargs) -> dict:
    """更新出价"""
    return {"action": "bid_updated", "ad_id": ad_id, "new_bid": new_bid}


@guard.protect(operation="create_ad")
def create_ad(ad_set_id: str, creative_id: str, headline: str, body: str, **kwargs) -> dict:
    """创建新广告"""
    return {"action": "ad_created", "creative_id": creative_id}


@guard.protect(operation="redistribute_budget")
def redistribute_budget(campaign_id: str, new_allocation: float, **kwargs) -> dict:
    """调整预算分配"""
    return {"action": "budget_redistributed", "campaign_id": campaign_id, "new_allocation": new_allocation}


AD_TOOLS = [get_ad_stats, pause_ad, update_bid, create_ad, redistribute_budget]
