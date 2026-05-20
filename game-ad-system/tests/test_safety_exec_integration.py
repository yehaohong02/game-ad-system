from src.safety.exceptions import BidConstraintException


def test_update_bid_blocked_by_safety():
    from src.safety.checks.bid_check import BidCheck

    check = BidCheck(max_ratio=2.0)

    try:
        check.validate(current_bid=5.0, new_bid=15.0)
        assert False, "Should raise"
    except BidConstraintException:
        pass
