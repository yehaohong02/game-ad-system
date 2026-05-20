from src.execution.schemas import AdAction, AdActionResult


def test_ad_action_defaults():
    """测试AdAction模型默认值"""
    action = AdAction(action="create")
    assert action.action == "create"
    assert action.ad_id == ""
    assert action.ad_set_id == ""
    assert action.creative_id == ""
    assert action.headline == ""
    assert action.body_text == ""
    assert action.new_bid == 0.0
    assert action.date_from == ""
    assert action.date_to == ""


def test_ad_action_with_values():
    """测试AdAction模型带参数"""
    action = AdAction(
        action="update_bid",
        ad_id="ad_123",
        new_bid=5.0
    )
    assert action.action == "update_bid"
    assert action.ad_id == "ad_123"
    assert action.new_bid == 5.0


def test_ad_action_result_defaults():
    """测试AdActionResult模型默认值"""
    result = AdActionResult(success=True, action="create")
    assert result.success is True
    assert result.action == "create"
    assert result.ad_id == ""
    assert result.message == ""
    assert result.data == {}


def test_ad_action_result_with_values():
    """测试AdActionResult模型带参数"""
    result = AdActionResult(
        success=False,
        action="pause",
        ad_id="ad_456",
        message="操作失败",
        data={"error": "budget_exceeded"}
    )
    assert result.success is False
    assert result.action == "pause"
    assert result.ad_id == "ad_456"
    assert result.message == "操作失败"
    assert result.data == {"error": "budget_exceeded"}


def test_ad_action_serialization():
    """测试AdAction序列化"""
    action = AdAction(action="create", ad_id="ad_789", headline="测试标题")
    data = action.model_dump()
    assert data["action"] == "create"
    assert data["ad_id"] == "ad_789"
    assert data["headline"] == "测试标题"


def test_ad_action_result_serialization():
    """测试AdActionResult序列化"""
    result = AdActionResult(success=True, action="update", message="成功")
    data = result.model_dump()
    assert data["success"] is True
    assert data["action"] == "update"
    assert data["message"] == "成功"
