from unittest.mock import patch, MagicMock


def test_guard_allows_safe_operation():
    from src.safety.guard import SafetyGuard

    guard = SafetyGuard()

    with patch.object(guard.budget_check, "validate"), \
         patch.object(guard.circuit_breaker, "can_execute", return_value=True), \
         patch.object(guard.bid_check, "validate"):

        @guard.protect
        def safe_func():
            return "ok"

        result = safe_func()
        assert result == "ok"


def test_guard_blocks_budget_exceeded():
    from src.safety.guard import SafetyGuard
    from src.safety.exceptions import BudgetExceededException

    guard = SafetyGuard()

    with patch.object(guard.budget_check, "validate", side_effect=BudgetExceededException(1000, 990)), \
         patch.object(guard.circuit_breaker, "can_execute", return_value=True):

        @guard.protect
        def risky_func(spend_amount=0.0):
            return "should not reach"

        try:
            risky_func(spend_amount=100.0)
            assert False, "Should raise"
        except BudgetExceededException:
            pass
