from datetime import date
from unittest.mock import patch, MagicMock


def test_base_adapter_is_abstract():
    import pytest
    from src.data.adapters.base import BaseAdapter

    with pytest.raises(TypeError):
        BaseAdapter()


def test_meta_adapter_fetch_returns_records():
    mock_response = {
        "data": [
            {
                "campaign_id": "camp_1",
                "adset_id": "adset_1",
                "ad_id": "ad_1",
                "creative": {"id": "cr_1"},
                "impressions": "10000",
                "clicks": "500",
                "spend": "250.0",
                "actions": [
                    {"action_type": "app_install", "value": "50"},
                ],
            }
        ]
    }

    with patch("src.data.adapters.meta_ads.httpx") as mock_httpx:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response
        mock_httpx.Client.return_value.__enter__.return_value.get.return_value = mock_resp

        from src.data.adapters.meta_ads import MetaAdsAdapter

        adapter = MetaAdsAdapter(access_token="fake", ad_account_id="act_123")
        records = adapter.fetch(date(2026, 5, 13))

        assert len(records) == 1
        assert records[0]["campaign_id"] == "camp_1"
        assert records[0]["impressions"] == 10000
