"""Central configuration via Pydantic Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    # ClickHouse
    clickhouse_host: str = "localhost"
    clickhouse_port: int = 8123
    clickhouse_database: str = "game_ad"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    # ChromaDB
    chromadb_host: str = "localhost"
    chromadb_port: int = 8000
    chromadb_collection: str = "creative_embeddings"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8080

    # Meta Ads
    meta_access_token: str = ""
    meta_ad_account_id: str = ""

    # AppsFlyer
    appsflyer_token: str = ""

    # AI Models
    openai_api_key: str = ""
    openai_base_url: str = ""
    anthropic_api_key: str = ""
    deepseek_api_key: str = ""
    dashscope_api_key: str = ""

    # Safety
    daily_budget_limit: float = 50000.0
    bid_change_limit: float = 0.2

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


settings = Settings()
