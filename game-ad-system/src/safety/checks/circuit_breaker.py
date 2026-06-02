import json
import time

from src.shared.config import settings
from src.shared.db.redis_client import get_redis_client
from src.safety.exceptions import CircuitBreakerOpenException

# Redis key prefix for circuit breaker state
_CB_KEY = "safety:circuit_breaker"


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

    def _get_state(self) -> dict:
        """Load circuit breaker state from Redis."""
        try:
            r = get_redis_client()
            raw = r.get(_CB_KEY)
            if raw:
                return json.loads(raw)
        except Exception:
            pass
        return {"failures": [], "last_failure_time": None, "is_open": False}

    def _save_state(self, state: dict) -> None:
        """Persist circuit breaker state to Redis."""
        try:
            r = get_redis_client()
            r.set(_CB_KEY, json.dumps(state), ex=self.window_minutes * 60 * 10)
        except Exception:
            pass

    def can_execute(self) -> bool:
        now = time.time()
        state = self._get_state()

        if state["is_open"] and state["last_failure_time"]:
            cooldown_end = state["last_failure_time"] + self.cooldown_minutes * 60
            if now >= cooldown_end:
                self._reset()
                return True
            remaining = int(cooldown_end - now)
            raise CircuitBreakerOpenException(remaining)

        # Prune old failures outside the window
        cutoff = now - self.window_minutes * 60
        failures = [f for f in state["failures"] if f >= cutoff]
        state["failures"] = failures
        self._save_state(state)

        return True

    def record_failure(self) -> None:
        now = time.time()
        state = self._get_state()

        state["failures"].append(now)
        state["last_failure_time"] = now

        # Prune old failures outside the window
        cutoff = now - self.window_minutes * 60
        state["failures"] = [f for f in state["failures"] if f >= cutoff]

        if len(state["failures"]) >= self.failure_threshold:
            state["is_open"] = True

        self._save_state(state)

    def record_success(self) -> None:
        pass

    def _reset(self) -> None:
        self._save_state({"failures": [], "last_failure_time": None, "is_open": False})