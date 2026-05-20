from unittest.mock import patch, MagicMock


def test_element_ranker_produces_ranking():
    mock_perf_data = [
        ("cr1", 1.5, 0.02, 12.0),
        ("cr2", 0.8, 0.015, 8.0),
    ]

    with patch("src.creative.analyzer.performance_fetcher.get_clickhouse_client") as mock_client:
        mock_ch = MagicMock()
        mock_ch.query.return_value.result_rows = mock_perf_data
        mock_client.return_value = mock_ch

        from src.creative.analyzer.element_ranker import rank_elements

        tags_map = {
            "cr1": ["真人讲解", "战斗画面"],
            "cr2": ["宝箱奖励"],
        }

        rankings = rank_elements(tags_map)

        assert isinstance(rankings, list)
