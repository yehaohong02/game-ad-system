from src.execution.adapters.meta_ads import MetaExecutionAdapter
from src.safety.guard import SafetyGuard

_safety_guard = SafetyGuard()


def _get_adapter() -> MetaExecutionAdapter:
    return MetaExecutionAdapter()


def update_bid(ad_id: str, new_bid: float, current_bid: float = 0.0) -> dict:
    """更新广告出价（带安全防护）"""
    if current_bid > 0:
        _safety_guard.bid_check.validate(current_bid, new_bid)

    _safety_guard.circuit_breaker.can_execute()

    adapter = _get_adapter()
    try:
        result = adapter.update_bid(ad_id, new_bid)
        _safety_guard.circuit_breaker.record_success()
        return {"success": True, "data": result, "message": f"出价已更新为 {new_bid}"}
    except Exception as e:
        _safety_guard.circuit_breaker.record_failure()
        return {"success": False, "data": {}, "message": f"出价更新失败: {str(e)}"}
