"""L1: 预算硬限制"""
from src.shared.db.redis_client import get_redis
from src.shared.config import settings


class BudgetCheck:
    def __init__(self):
        self.redis = get_redis()

    def validate(self, account_id: str, spend_amount: float):
        key = f"budget:daily:{account_id}"
        current = float(self.redis.get(key) or 0)
        if current + spend_amount > settings.daily_budget_limit:
            raise BudgetExceeded(
                f"日预算超限: 当前 {current}, 新增 {spend_amount}, 上限 {settings.daily_budget_limit}"
            )
        self.redis.incrbyfloat(key, spend_amount)
        self.redis.expire(key, 86400)


class BudgetExceeded(Exception):
    pass
