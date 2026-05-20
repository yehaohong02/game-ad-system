import os
from unittest.mock import patch


def test_settings_loads_from_env():
    env_vars = {
        "CLICKHOUSE_HOST": "test-host",
        "CLICKHOUSE_PORT": "9000",
        "REDIS_HOST": "test-redis",
        "META_ACCESS_TOKEN": "test-token",
        "DAILY_BUDGET_LIMIT": "5000.00",
    }
    with patch.dict(os.environ, env_vars, clear=False):
        import importlib
        import src.shared.config as config_mod
        importlib.reload(config_mod)

        settings = config_mod.Settings()
        assert settings.clickhouse_host == "test-host"
        assert settings.clickhouse_port == 9000
        assert settings.redis_host == "test-redis"
        assert settings.meta_access_token == "test-token"
        assert settings.daily_budget_limit == 5000.00
