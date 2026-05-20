from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.standard.operators.python import PythonOperator

from src.data.adapters.meta_ads import MetaAdsAdapter
from src.data.adapters.appsflyer import AppsFlyerAdapter
from src.data.merger import merge_and_clean
from src.data.loader import load_to_clickhouse
from src.data.anomaly import detect_anomalies
from src.shared.config import settings


default_args = {
    "owner": "data-team",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    dag_id="data_pipeline_daily",
    default_args=default_args,
    description="每日广告数据采集、清洗、存储、异常检测",
    schedule="0 2 * * *",
    start_date=datetime(2026, 5, 1),
    catchup=False,
)


def _extract_meta(**context):
    adapter = MetaAdsAdapter()
    target_date = datetime.strptime(context["ds"], "%Y-%m-%d").date()
    records = adapter.fetch(target_date)
    context["ti"].xcom_push(key="meta_records", value=records)
    return len(records)


def _extract_appsflyer(**context):
    adapter = AppsFlyerAdapter()
    target_date = datetime.strptime(context["ds"], "%Y-%m-%d").date()
    records = adapter.fetch(target_date)
    context["ti"].xcom_push(key="af_records", value=records)
    return len(records)


def _merge(**context):
    meta_records = context["ti"].xcom_pull(key="meta_records", task_ids="extract_meta_ads")
    af_records = context["ti"].xcom_pull(key="af_records", task_ids="extract_appsflyer")
    target_date = datetime.strptime(context["ds"], "%Y-%m-%d").date()
    merged = merge_and_clean(meta_records or [], af_records or [], target_date, settings.meta_ad_account_id)
    context["ti"].xcom_push(key="merged_records", value=merged)
    return len(merged)


def _load(**context):
    merged = context["ti"].xcom_pull(key="merged_records", task_ids="merge_and_clean")
    load_to_clickhouse(merged or [])


def _detect(**context):
    target_date = datetime.strptime(context["ds"], "%Y-%m-%d").date()
    alerts = detect_anomalies(target_date)
    return len(alerts)


extract_meta = PythonOperator(task_id="extract_meta_ads", python_callable=_extract_meta, dag=dag)
extract_af = PythonOperator(task_id="extract_appsflyer", python_callable=_extract_appsflyer, dag=dag)
merge = PythonOperator(task_id="merge_and_clean", python_callable=_merge, dag=dag)
load = PythonOperator(task_id="load_to_clickhouse", python_callable=_load, dag=dag)
detect = PythonOperator(task_id="detect_anomalies", python_callable=_detect, dag=dag)

[extract_meta, extract_af] >> merge >> load >> detect
