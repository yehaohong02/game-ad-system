from datetime import date
from unittest.mock import patch, MagicMock


def test_appsflyer_fetch_returns_records():
    mock_response = {
        "data": [
            {
                "Install Time": "2026-05-13 10:00:00",
                "Campaign ID": "camp_1",
                "Adset ID": "adset_1",
                "Ad ID": "ad_1",
                "Media Source": "facebook",
                "Country Code": "US",
                "Platform": "ios",
                "Event Name": "install",
                "Revenue": "0",
            },
            {
                "Install Time": "2026-05-13 12:00:00",
                "Campaign ID": "camp_1",
                "Adset ID": "adset_1",
                "Ad ID": "ad_1",
                "Media Source": "facebook",
                "Country Code": "US",
                "Platform": "ios",
                "Event Name": "af_purchase",
                "Revenue": "9.99",
            },
        ]
    }

    with patch("src.data.adapters.appsflyer.httpx") as mock_httpx:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response
        mock_httpx.Client.return_value.__enter__.return_value.get.return_value = mock_resp

        from src.data.adapters.appsflyer import AppsFlyerAdapter

        adapter = AppsFlyerAdapter(api_token="fake", app_id="app_123")
        records = adapter.fetch(date(2026, 5, 13))

        assert len(records) == 1
        assert records[0]["installs"] == 1
        assert records[0]["revenue"] == 9.99
