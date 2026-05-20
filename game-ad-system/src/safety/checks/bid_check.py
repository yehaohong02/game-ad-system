import logging
from src.shared.config import settings
from src.safety.exceptions import BidConstraintException

logger = logging.getLogger(__name__)


class BidCheck:
    def __init__(self, max_ratio: float | None = None):
        self.max_ratio = max_ratio or settings.bid_increase_max_ratio

    def validate(self, current_bid: float, new_bid: float) -> None:
        if current_bid <= 0:
            return

        ratio = new_bid / current_bid
        if ratio > self.max_ratio:
            logger.warning(
                "出价约束拦截: ad 当前出价=%.2f, 新出价=%.2f, 比值=%.2f, 上限=%.2f",
                current_bid, new_bid, ratio, self.max_ratio,
            )
            raise BidConstraintException(current_bid, new_bid, self.max_ratio)
