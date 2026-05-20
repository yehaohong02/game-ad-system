"""安全防护装饰器"""
import functools
import logging
from typing import Callable
from src.safety.checks.budget_check import BudgetCheck, BudgetExceeded
from src.safety.checks.circuit_breaker import CircuitBreaker, CircuitOpen
from src.safety.checks.bid_check import BidCheck, InvalidBid

logger = logging.getLogger(__name__)


class SafetyGuard:
    def __init__(self):
        self.budget = BudgetCheck()
        self.circuit = CircuitBreaker()
        self.bid = BidCheck()

    def protect(self, operation: str = "default"):
        def decorator(func: Callable):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                self.circuit.can_execute(operation)

                account_id = kwargs.get("account_id", "default")
                spend = kwargs.get("spend_amount", 0)
                if spend > 0:
                    self.budget.validate(account_id, spend)

                current_bid = kwargs.get("current_bid", 0)
                new_bid = kwargs.get("new_bid", 0)
                if current_bid > 0 and new_bid > 0:
                    self.bid.validate(current_bid, new_bid)

                try:
                    result = func(*args, **kwargs)
                    self.circuit.record_success(operation)
                    return result
                except (BudgetExceeded, CircuitOpen, InvalidBid):
                    raise
                except Exception as e:
                    self.circuit.record_failure(operation)
                    raise

            return wrapper
        return decorator


guard = SafetyGuard()
