from src.safety.exceptions import BidConstraintException


def test_bid_check_passes():
    from src.safety.checks.bid_check import BidCheck
    check = BidCheck(max_ratio=2.0)
    check.validate(current_bid=5.0, new_bid=8.0)


def test_bid_check_exceeds():
    from src.safety.checks.bid_check import BidCheck
    check = BidCheck(max_ratio=2.0)
    try:
        check.validate(current_bid=5.0, new_bid=15.0)
        assert False, "Should have raised"
    except BidConstraintException:
        pass


def test_bid_check_zero_bid():
    from src.safety.checks.bid_check import BidCheck
    check = BidCheck(max_ratio=2.0)
    check.validate(current_bid=0.0, new_bid=100.0)
