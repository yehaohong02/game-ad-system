"""L3: 出价合理性校验"""
from src.shared.config import settings


class BidCheck:
    def validate(self, current_bid: float, new_bid: float):
        if current_bid <= 0 or new_bid <= 0:
            raise InvalidBid("出价必须大于 0")
        change_rate = abs(new_bid - current_bid) / current_bid
        if change_rate > settings.bid_change_limit:
            raise InvalidBid(
                f"出价变化过大: {change_rate:.0%} > {settings.bid_change_limit:.0%}"
            )


class InvalidBid(Exception):
    pass
