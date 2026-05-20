from datetime import datetime, timedelta


def test_circuit_breaker_allows_when_closed():
    from src.safety.checks.circuit_breaker import CircuitBreaker
    cb = CircuitBreaker(window_minutes=10, failure_threshold=3, cooldown_minutes=5)
    assert cb.can_execute() is True


def test_circuit_breaker_opens_after_threshold():
    from src.safety.checks.circuit_breaker import CircuitBreaker
    from src.safety.exceptions import CircuitBreakerOpenException

    cb = CircuitBreaker(window_minutes=10, failure_threshold=3, cooldown_minutes=5)
    cb.record_failure()
    cb.record_failure()
    assert cb.can_execute() is True
    cb.record_failure()
    try:
        cb.can_execute()
        assert False, "Should have raised"
    except CircuitBreakerOpenException:
        pass


def test_circuit_breaker_recovers_after_cooldown():
    from src.safety.checks.circuit_breaker import CircuitBreaker
    from src.safety.exceptions import CircuitBreakerOpenException

    cb = CircuitBreaker(window_minutes=10, failure_threshold=2, cooldown_minutes=5)
    cb.record_failure()
    cb.record_failure()

    try:
        cb.can_execute()
        assert False, "Should raise"
    except CircuitBreakerOpenException:
        pass

    cb._last_failure_time = datetime.now() - timedelta(minutes=6)
    assert cb.can_execute() is True
