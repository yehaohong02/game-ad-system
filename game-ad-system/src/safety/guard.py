import functools
import inspect
import logging
from typing import Callable, Any

from src.safety.checks.budget_check import BudgetCheck
from src.safety.checks.circuit_breaker import CircuitBreaker
from src.safety.checks.bid_check import BidCheck

logger = logging.getLogger(__name__)


class SafetyGuard:
    """安全防护中间件 - 装饰器模式"""

    def __init__(self):
        self.budget_check = BudgetCheck()
        self.circuit_breaker = CircuitBreaker()
        self.bid_check = BidCheck()

    def protect(self, func: Callable) -> Callable:
        """装饰器：在函数执行前进行安全检查。
        支持位置参数和关键字参数，通过函数签名自动映射参数名。"""

        sig = inspect.signature(func)

        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Bind positional args to parameter names so we can extract safety-related values
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()

            new_bid = bound.arguments.get("new_bid")
            current_bid = bound.arguments.get("current_bid", 0.0)
            spend_amount = bound.arguments.get("spend_amount", 0.0)

            # L2: 熔断器检查
            self.circuit_breaker.can_execute()

            # L1: 预算检查
            if spend_amount > 0:
                self.budget_check.validate(spend_amount)

            # L3: 出价约束
            if new_bid is not None and current_bid > 0:
                self.bid_check.validate(current_bid, new_bid)

            try:
                result = func(*args, **kwargs)
                self.circuit_breaker.record_success()
                return result
            except Exception as e:
                self.circuit_breaker.record_failure()
                raise

        return wrapper