"""L2: 操作熔断器"""
import time
from src.shared.db.redis_client import get_redis


class CircuitBreaker:
    def __init__(self, window_seconds: int = 600, failure_threshold: int = 3, cooldown_seconds: int = 300):
        self.redis = get_redis()
        self.window = window_seconds
        self.threshold = failure_threshold
        self.cooldown = cooldown_seconds

    def can_execute(self, operation: str):
        key = f"circuit:{operation}"
        state = self.redis.get(f"{key}:state")
        if state == "open":
            opened_at = float(self.redis.get(f"{key}:opened_at") or 0)
            if time.time() - opened_at > self.cooldown:
                self.redis.delete(f"{key}:state", f"{key}:opened_at")
                self.redis.delete(f"{key}:failures")
            else:
                raise CircuitOpen(f"熔断器已开启: {operation}，冷却中")

    def record_failure(self, operation: str):
        key = f"circuit:{operation}:failures"
        count = self.redis.incr(key)
        if count == 1:
            self.redis.expire(key, self.window)
        if count >= self.threshold:
            self.redis.set(f"circuit:{operation}:state", "open")
            self.redis.set(f"circuit:{operation}:opened_at", time.time())

    def record_success(self, operation: str):
        self.redis.delete(f"circuit:{operation}:failures")


class CircuitOpen(Exception):
    pass
