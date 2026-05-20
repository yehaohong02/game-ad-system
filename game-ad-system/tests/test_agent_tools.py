from unittest.mock import patch, MagicMock


def test_create_ad_tool():
    with patch("src.execution.tools.create_ad._get_adapter") as mock_get:
        mock_adapter = MagicMock()
        mock_adapter.create_ad.return_value = {"id": "new_ad"}
        mock_get.return_value = mock_adapter

        from src.execution.tools.create_ad import create_ad
        result = create_ad("adset_1", "cr_1", "Headline", "Body")
        assert result["success"] is True


def test_update_bid_tool():
    with patch("src.execution.tools.update_bid._get_adapter") as mock_get:
        mock_adapter = MagicMock()
        mock_adapter.update_bid.return_value = {"success": True}
        mock_get.return_value = mock_adapter

        from src.execution.tools.update_bid import update_bid
        result = update_bid("ad_1", 5.0)
        assert result["success"] is True


def test_pause_ad_tool():
    with patch("src.execution.tools.pause_ad._get_adapter") as mock_get:
        mock_adapter = MagicMock()
        mock_adapter.pause_ad.return_value = {"success": True}
        mock_get.return_value = mock_adapter

        from src.execution.tools.pause_ad import pause_ad
        result = pause_ad("ad_1")
        assert result["success"] is True
