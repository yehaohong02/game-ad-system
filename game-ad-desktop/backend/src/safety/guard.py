"""安全防护装饰器"""
import functools
import logging
from typing import Callable
from src.safety.checks.budget_check import BudgetCheck, BudgetExceeded
from src.safety.checks.circuit_breaker import CircuitBreaker, CircuitOpen
from src.safety.checks.bid_check import BidCheck, InvalidBid

logger = logging.getLogger(__name__)

# Operations that MUST have spend validated, mapped to their spend-parameter name
_SPENDING_OPS = {"redistribute_budget": "new_allocation"}
# Operations that MUST have bid values validated
_BID_OPS = {"update_bid"}


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

                # Budget check: mandatory for spending ops, optional for others
                account_id = kwargs.get("account_id", "default")
                spend = kwargs.get("spend_amount", 0)
                if operation in _SPENDING_OPS:
                    spend_param = _SPENDING_OPS[operation]
                    spend = kwargs.get(spend_param, spend)
                    if spend <= 0:
                        raise ValueError(
                            f"操作 '{operation}' 需要 {spend_param} > 0"
                        )
                    self.budget.validate(account_id, spend)
                elif spend > 0:
                    self.budget.validate(account_id, spend)

                # Bid check: mandatory for bid ops, optional for others
                current_bid = kwargs.get("current_bid", 0)
                new_bid = kwargs.get("new_bid", 0)
                if operation in _BID_OPS:
                    if current_bid <= 0 or new_bid <= 0:
                        raise ValueError(
                            f"操作 '{operation}' 需要 current_bid > 0 且 new_bid > 0"
                        )
                    self.bid.validate(current_bid, new_bid)
                elif current_bid > 0 and new_bid > 0:
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