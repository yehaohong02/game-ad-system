from celery import Celery
from src.shared.config import settings

app = Celery(
    "game_ad",
    broker=f"redis://{settings.redis_host}:{settings.redis_port}/{settings.redis_db}",
    backend=f"redis://{settings.redis_host}:{settings.redis_port}/{settings.redis_db + 1}",
)

app.conf.timezone = "Asia/Shanghai"

app.conf.beat_schedule = {
    "daily-data-pipeline": {
        "task": "tasks.data_tasks.run_daily_pipeline",
        "schedule": {"hour": 2, "minute": 0},
    },
    "hourly-anomaly-check": {
        "task": "tasks.data_tasks.check_anomalies",
        "schedule": 3600.0,
    },
    "weekly-memory-sync": {
        "task": "tasks.memory_tasks.sync_cases",
        "schedule": {"hour": 3, "minute": 0, "day_of_week": 0},
    },
    "daily-creative-rank": {
        "task": "tasks.creative_tasks.rank_creatives",
        "schedule": {"hour": 6, "minute": 0},
    },
}
