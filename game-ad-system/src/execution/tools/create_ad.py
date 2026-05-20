from src.execution.adapters.meta_ads import MetaExecutionAdapter


def _get_adapter() -> MetaExecutionAdapter:
    return MetaExecutionAdapter()


def create_ad(ad_set_id: str, creative_id: str, headline: str, body_text: str) -> dict:
    """创建新广告"""
    adapter = _get_adapter()
    try:
        result = adapter.create_ad(ad_set_id, creative_id, headline, body_text)
        return {"success": True, "data": result, "message": f"广告创建成功: {result.get('id', 'unknown')}"}
    except Exception as e:
        return {"success": False, "data": {}, "message": f"创建失败: {str(e)}"}
