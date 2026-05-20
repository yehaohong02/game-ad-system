from datetime import date, timedelta
from src.shared.db.clickhouse import get_clickhouse_client
from src.memory.store import MemoryStore
from src.memory.summarizer import summarize_campaign


ENDED_CAMPAIGNS_QUERY = """
SELECT
    campaign_id,
    sum(spend) as total_spend,
    sum(installs) as total_installs,
    sum(revenue) as total_revenue,
    if(sum(spend) > 0, sum(revenue) / sum(spend), 0) as roas,
    any(country) as country,
    any(platform) as platform
FROM ads_performance
WHERE date >= %(start_date)s AND date <= %(end_date)s
GROUP BY campaign_id
HAVING max(date) < %(cutoff_date)s
"""


def sync_ended_campaigns(days_back: int = 30, cutoff_days: int = 3) -> int:
    client = get_clickhouse_client()
    today = date.today()

    params = {
        "start_date": today - timedelta(days=days_back),
        "end_date": today,
        "cutoff_date": today - timedelta(days=cutoff_days),
    }

    result = client.query(ENDED_CAMPAIGNS_QUERY, parameters=params)
    store = MemoryStore()
    count = 0

    for row in result.result_rows:
        campaign_id = row[0]
        perf_data = {
            "total_spend": row[1],
            "total_installs": row[2],
            "total_revenue": row[3],
            "roas": row[4],
            "country": row[5],
            "platform": row[6],
        }

        try:
            case = summarize_campaign(campaign_id, perf_data)
            store.save_case(case)
            count += 1
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to summarize {campaign_id}: {e}")

    return count
