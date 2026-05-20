from unittest.mock import patch, MagicMock
from datetime import date


def test_sync_ended_campaigns():
    mock_rows = [
        ("camp_1", 5000.0, 3200, 4800.0, 1.2, "US", "iOS"),
    ]

    with patch("src.memory.dag_sync.get_clickhouse_client") as mock_ch_client, \
         patch("src.memory.dag_sync.MemoryStore") as mock_store_class, \
         patch("src.memory.dag_sync.summarize_campaign") as mock_summarize:

        mock_ch = MagicMock()
        mock_ch.query.return_value.result_rows = mock_rows
        mock_ch_client.return_value = mock_ch

        mock_store = MagicMock()
        mock_store_class.return_value = mock_store

        from src.memory.schemas import CampaignCase, CampaignResult
        mock_summarize.return_value = CampaignCase(
            campaign_id="camp_1",
            objective="ROAS >= 0.8",
            budget=5000.0,
            country="US",
            platform="iOS",
            creative_tags=[],
            final_result=CampaignResult(roas=1.2, total_installs=3200, total_spend=4800.0),
            key_decisions=[],
            lessons_learned="测试",
        )

        from src.memory.dag_sync import sync_ended_campaigns
        count = sync_ended_campaigns()

        assert count == 1
        mock_store.save_case.assert_called_once()
