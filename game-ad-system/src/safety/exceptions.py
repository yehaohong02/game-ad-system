class SafetyException(Exception):
    """安全防护异常基类"""
    pass


class BudgetExceededException(SafetyException):
    def __init__(self, limit: float, current: float):
        self.limit = limit
        self.current = current
        super().__init__(f"预算超限: 当日已消耗 {current:.2f}，总预算 {limit:.2f}")


class CircuitBreakerOpenException(SafetyException):
    def __init__(self, cooldown_remaining: int):
        self.cooldown_remaining = cooldown_remaining
        super().__init__(f"操作熔断: 系统暂时不可用，冷却剩余 {cooldown_remaining} 秒")


class BidConstraintException(SafetyException):
    def __init__(self, current_bid: float, new_bid: float, max_ratio: float):
        self.current_bid = current_bid
        self.new_bid = new_bid
        self.max_ratio = max_ratio
        super().__init__(f"出价约束: 新出价 {new_bid} 超过当前出价 {current_bid} 的 {max_ratio * 100:.0f}% 上限")
