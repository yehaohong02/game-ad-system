from datetime import date
from decimal import Decimal

from src.shared.db.redis_client import get_redis_client
from src.shared.config import settings
from src.safety.exceptions import BudgetExceededException


class BudgetCheck:
    def __init__(self, daily_limit: float | None = None):
        self.daily_limit = Decimal(str(daily_limit or settings.daily_budget_limit))

    def _budget_key(self) -> str:
        return f"budget:daily:{date.today()}"

    def get_current_spend(self) -> Decimal:
        redis = get_redis_client()
        value = redis.get(self._budget_key())
        if value is None:
            return Decimal("0")
        return Decimal(value)

    def validate(self, spend_amount: float) -> None:
        current = self.get_current_spend()
        projected = current + Decimal(str(spend_amount))
        if projected > self.daily_limit:
            raise BudgetExceededException(float(self.daily_limit), float(current))

    def record_spend(self, amount: float) -> None:
        redis = get_redis_client()
        redis.incrbyfloat(self._budget_key(), amount)
        redis.expire(self._budget_key(), 172800)
