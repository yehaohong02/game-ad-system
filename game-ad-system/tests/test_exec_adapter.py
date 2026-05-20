import pytest
from unittest.mock import patch, MagicMock


def test_base_adapter_is_abstract():
    from src.execution.adapters.base import PlatformAdapter
    with pytest.raises(TypeError):
        PlatformAdapter()


def test_meta_adapter_create_ad():
    mock_response = {"id": "new_ad_123"}

    with patch("src.execution.adapters.meta_ads.httpx") as mock_httpx:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response
        mock_httpx.Client.return_value.__enter__.return_value.post.return_value = mock_resp

        from src.execution.adapters.meta_ads import MetaExecutionAdapter

        adapter = MetaExecutionAdapter(access_token="fake", ad_account_id="act_123")
        result = adapter.create_ad("adset_1", "cr_1", "Test Headline", "Test Body")

        assert result["id"] == "new_ad_123"


def test_meta_adapter_pause_ad():
    mock_response = {"success": True}

    with patch("src.execution.adapters.meta_ads.httpx") as mock_httpx:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response
        mock_httpx.Client.return_value.__enter__.return_value.post.return_value = mock_resp

        from src.execution.adapters.meta_ads import MetaExecutionAdapter

        adapter = MetaExecutionAdapter(access_token="fake", ad_account_id="act_123")
        result = adapter.pause_ad("ad_1")

        assert result["success"] is True
