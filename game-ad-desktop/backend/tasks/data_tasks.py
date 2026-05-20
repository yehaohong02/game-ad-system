from tasks.celery_app import app
from datetime import date, timedelta


@app.task
def run_daily_pipeline(target_date: str = None):
    if target_date is None:
        target_date = str(date.today() - timedelta(days=1))
    from src.data.adapters.meta_ads import MetaAdsAdapter
    from src.data.adapters.appsflyer import AppsFlyerAdapter
    from src.data.etl.merger import merge_and_clean
    from src.data.etl.loader import load_to_clickhouse
    from src.shared.config import settings

    d = date.fromisoformat(target_date)
    meta = MetaAdsAdapter().fetch(d)
    af = AppsFlyerAdapter().fetch(d)
    merged = merge_and_clean(meta, af, d, settings.meta_ad_account_id)
    load_to_clickhouse(merged)
    return {"records": len(merged)}


@app.task
def check_anomalies():
    from src.data.anomaly import detect_anomalies
    alerts = detect_anomalies(date.today())
    return {"alerts": len(alerts)}
