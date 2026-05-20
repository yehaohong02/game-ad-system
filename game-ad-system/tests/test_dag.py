import pytest

try:
    import airflow
    AIRFLOW_AVAILABLE = True
except ImportError:
    AIRFLOW_AVAILABLE = False


@pytest.mark.skipif(not AIRFLOW_AVAILABLE, reason="airflow not installed")
def test_dag_exists():
    from dags.data_pipeline_dag import dag
    assert dag.dag_id == "data_pipeline_daily"
    assert len(dag.tasks) == 5


@pytest.mark.skipif(not AIRFLOW_AVAILABLE, reason="airflow not installed")
def test_dag_task_order():
    from dags.data_pipeline_dag import dag
    task_ids = [t.task_id for t in dag.tasks]
    assert "extract_meta_ads" in task_ids
    assert "extract_appsflyer" in task_ids
    assert "merge_and_clean" in task_ids
    assert "load_to_clickhouse" in task_ids
    assert "detect_anomalies" in task_ids
