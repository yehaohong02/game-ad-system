def test_budget_exception():
    from src.safety.exceptions import BudgetExceededException
    exc = BudgetExceededException(10000.0, 10500.0)
    assert "10000" in str(exc)
    assert "10500" in str(exc)


def test_circuit_breaker_exception():
    from src.safety.exceptions import CircuitBreakerOpenException
    exc = CircuitBreakerOpenException(300)
    assert "300" in str(exc)


def test_bid_constraint_exception():
    from src.safety.exceptions import BidConstraintException
    exc = BidConstraintException(5.0, 15.0, 2.0)
    assert "15.0" in str(exc)
    assert "200%" in str(exc)
