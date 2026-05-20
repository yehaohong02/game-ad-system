from unittest.mock import patch, MagicMock
from decimal import Decimal


def test_budget_check_passes():
    with patch("src.safety.checks.budget_check.get_redis_client") as mock_get:
        mock_redis = MagicMock()
        mock_redis.get.return_value = "5000.00"
        mock_get.return_value = mock_redis

        from src.safety.checks.budget_check import BudgetCheck
        check = BudgetCheck(daily_limit=10000.0)
        check.validate(spend_amount=100.0)


def test_budget_check_exceeds():
    with patch("src.safety.checks.budget_check.get_redis_client") as mock_get:
        mock_redis = MagicMock()
        mock_redis.get.return_value = "9950.00"
        mock_get.return_value = mock_redis

        from src.safety.checks.budget_check import BudgetCheck
        from src.safety.exceptions import BudgetExceededException

        check = BudgetCheck(daily_limit=10000.0)
        try:
            check.validate(spend_amount=100.0)
            assert False, "Should have raised"
        except BudgetExceededException:
            pass
