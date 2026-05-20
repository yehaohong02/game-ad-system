from src.execution.adapters.meta_ads import MetaExecutionAdapter


def _get_adapter() -> MetaExecutionAdapter:
    return MetaExecutionAdapter()


def pause_ad(ad_id: str) -> dict:
    """暂停广告"""
    adapter = _get_adapter()
    try:
        result = adapter.pause_ad(ad_id)
        return {"success": True, "data": result, "message": f"广告 {ad_id} 已暂停"}
    except Exception as e:
        return {"success": False, "data": {}, "message": f"暂停失败: {str(e)}"}
