"""L1: 预算硬限制"""
from src.shared.db.redis_client import get_redis
from src.shared.config import settings

# Atomic Lua script: check-and-increment in a single Redis call
_BUDGET_LUA_SCRIPT = """
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(ARGV[2])
if current + tonumber(ARGV[1]) > limit then
    return -1
end
return redis.call('INCRBYFLOAT', KEYS[1], ARGV[1])
"""


class BudgetCheck:
    def __init__(self):
        self.redis = get_redis()
        self._script = self.redis.register_script(_BUDGET_LUA_SCRIPT)

    def validate(self, account_id: str, spend_amount: float):
        key = f"budget:daily:{account_id}"
        result = self._script(
            keys=[key],
            args=[str(spend_amount), str(settings.daily_budget_limit)],
        )
        if result == -1:
            current = float(self.redis.get(key) or 0)
            raise BudgetExceeded(
                f"日预算超限: 当前 {current}, 新增 {spend_amount}, 上限 {settings.daily_budget_limit}"
            )
        self.redis.expire(key, 86400)


class BudgetExceeded(Exception):
    pass