import logging
from tasks.celery_app import app

logger = logging.getLogger(__name__)


@app.task
def sync_cases():
    from src.memory.summarizer import generate_summary
    from src.memory.store import store_case
    from src.shared.db.clickhouse import get_clickhouse

    client = get_clickhouse()
    rows = client.query("""
        SELECT campaign_id, country, platform,
               sum(spend) as total_spend, sum(installs) as total_installs,
               avg(roi) as avg_roas
        FROM ads_performance
        WHERE date >= today() - 7
        GROUP BY campaign_id, country, platform
        HAVING total_spend > 500
    """)

    col_names = rows.column_names
    count = 0
    errors = 0
    for row in rows.result_rows:
        try:
            rec = dict(zip(col_names, row))
            case = {
                "case_id": f"case_{rec['campaign_id']}_{rec['country']}_{rec['platform']}",
                "campaign_id": rec["campaign_id"],
                "country": rec["country"],
                "platform": rec["platform"],
                "final_result": {
                    "total_spend": rec["total_spend"],
                    "total_installs": rec["total_installs"],
                    "roas": rec["avg_roas"],
                },
            }
            case["summary"] = generate_summary(case)
            store_case(case)
            count += 1
        except Exception as e:
            errors += 1
            logger.warning("Failed to sync case for row %s: %s", row, e)

    return {"synced": count, "errors": errors}
