from unittest.mock import patch, MagicMock


def test_get_ad_stats_success():
    """测试成功查询广告数据"""
    with patch("src.execution.tools.get_ad_stats._get_adapter") as mock_get_adapter:
        mock_adapter = MagicMock()
        mock_adapter.get_ad_stats.return_value = {
            "impressions": 1000,
            "clicks": 50,
            "installs": 10,
            "spend": 100.0
        }
        mock_get_adapter.return_value = mock_adapter

        from src.execution.tools.get_ad_stats import get_ad_stats
        result = get_ad_stats("ad_123", "2024-01-01", "2024-01-07")

        assert result["success"] is True
        assert "data" in result
        assert result["data"]["impressions"] == 1000
        assert result["message"] == "查询成功"


def test_get_ad_stats_failure():
    """测试查询广告数据失败"""
    with patch("src.execution.tools.get_ad_stats._get_adapter") as mock_get_adapter:
        mock_adapter = MagicMock()
        mock_adapter.get_ad_stats.side_effect = Exception("API连接失败")
        mock_get_adapter.return_value = mock_adapter

        from src.execution.tools.get_ad_stats import get_ad_stats
        result = get_ad_stats("ad_123", "2024-01-01", "2024-01-07")

        assert result["success"] is False
        assert result["data"] == {}
        assert "API连接失败" in result["message"]


def test_get_ad_stats_adapter_creation():
    """测试适配器创建"""
    with patch("src.execution.tools.get_ad_stats.MetaExecutionAdapter") as mock_adapter_class:
        mock_adapter = MagicMock()
        mock_adapter_class.return_value = mock_adapter

        from src.execution.tools.get_ad_stats import _get_adapter
        adapter = _get_adapter()

        assert adapter is not None
        mock_adapter_class.assert_called_once()
