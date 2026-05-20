from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    # ClickHouse
    clickhouse_host: str = Field(default="localhost")
    clickhouse_port: int = Field(default=8123)
    clickhouse_user: str = Field(default="default")
    clickhouse_password: str = Field(default="")
    clickhouse_database: str = Field(default="game_ads")

    # Redis
    redis_host: str = Field(default="localhost")
    redis_port: int = Field(default=6379)
    redis_db: int = Field(default=0)

    # Meta Ads
    meta_access_token: str = Field(default="")
    meta_ad_account_id: str = Field(default="")
    meta_app_id: str = Field(default="")
    meta_app_secret: str = Field(default="")

    # AppsFlyer
    appsflyer_api_token: str = Field(default="")
    appsflyer_app_id: str = Field(default="")

    # OpenAI
    openai_api_key: str = Field(default="")

    # Safety
    daily_budget_limit: float = Field(default=10000.0)
    bid_increase_max_ratio: float = Field(default=2.0)

    # Circuit Breaker
    circuit_breaker_window_minutes: int = Field(default=10)
    circuit_breaker_failure_threshold: int = Field(default=3)
    circuit_breaker_cooldown_minutes: int = Field(default=5)


settings = Settings()
