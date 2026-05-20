from src.execution.adapters.meta_ads import MetaExecutionAdapter


def _get_adapter() -> MetaExecutionAdapter:
    return MetaExecutionAdapter()


def get_ad_stats(ad_id: str, date_from: str, date_to: str) -> dict:
    """查询广告数据"""
    adapter = _get_adapter()
    try:
        result = adapter.get_ad_stats(ad_id, date_from, date_to)
        return {"success": True, "data": result, "message": "查询成功"}
    except Exception as e:
        return {"success": False, "data": {}, "message": f"查询失败: {str(e)}"}
