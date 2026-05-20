from datetime import datetime, timedelta
from collections import deque

from src.shared.config import settings
from src.safety.exceptions import CircuitBreakerOpenException


class CircuitBreaker:
    def __init__(
        self,
        window_minutes: int | None = None,
        failure_threshold: int | None = None,
        cooldown_minutes: int | None = None,
    ):
        self.window_minutes = window_minutes or settings.circuit_breaker_window_minutes
        self.failure_threshold = failure_threshold or settings.circuit_breaker_failure_threshold
        self.cooldown_minutes = cooldown_minutes or settings.circuit_breaker_cooldown_minutes

        self._failures: deque[datetime] = deque()
        self._last_failure_time: datetime | None = None
        self._is_open: bool = False

    def can_execute(self) -> bool:
        now = datetime.now()

        if self._is_open and self._last_failure_time:
            cooldown_end = self._last_failure_time + timedelta(minutes=self.cooldown_minutes)
            if now >= cooldown_end:
                self._reset()
                return True
            remaining = int((cooldown_end - now).total_seconds())
            raise CircuitBreakerOpenException(remaining)

        cutoff = now - timedelta(minutes=self.window_minutes)
        while self._failures and self._failures[0] < cutoff:
            self._failures.popleft()

        return True

    def record_failure(self) -> None:
        now = datetime.now()
        self._failures.append(now)
        self._last_failure_time = now

        cutoff = now - timedelta(minutes=self.window_minutes)
        while self._failures and self._failures[0] < cutoff:
            self._failures.popleft()

        if len(self._failures) >= self.failure_threshold:
            self._is_open = True

    def record_success(self) -> None:
        pass

    def _reset(self) -> None:
        self._failures.clear()
        self._is_open = False
        self._last_failure_time = None
