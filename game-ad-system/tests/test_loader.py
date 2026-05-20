from datetime import date
from unittest.mock import patch, MagicMock

from src.data.loader import load_to_clickhouse


def test_load_to_clickhouse():
    with patch("src.data.loader.get_clickhouse_client") as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        records = [
            {
                "date": date(2026, 5, 13),
                "ad_account_id": "act_123",
                "campaign_id": "c1",
                "ad_set_id": "s1",
                "ad_id": "a1",
                "creative_id": "cr1",
                "country": "US",
                "platform": "ios",
                "impressions": 1000,
                "clicks": 50,
                "spend": 100.0,
                "installs": 10,
                "revenue": 150.0,
                "roi": 1.5,
            }
        ]

        load_to_clickhouse(records)

        mock_client.insert.assert_called_once()
        call_args = mock_client.insert.call_args
        assert call_args[0][0] == "ads_performance"
        assert len(call_args[0][1]) == 1
