from datetime import date
from unittest.mock import patch, MagicMock


def test_detect_anomalies_spend_warning():
    with patch("src.data.anomaly.get_clickhouse_client") as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.query.return_value.result_rows = [
            ("c1", "warning", 140.0, 100.0, 40.0, "", 0, 0, 0),
        ]

        from src.data.anomaly import detect_anomalies
        alerts = detect_anomalies(date(2026, 5, 13))

        assert len(alerts) == 1
        assert alerts[0]["severity"] == "warning"
        assert alerts[0]["metric"] == "spend"


def test_detect_anomalies_cpi_critical():
    with patch("src.data.anomaly.get_clickhouse_client") as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.query.return_value.result_rows = [
            ("c1", "", 0, 0, 0, "critical", 8.0, 4.0, 100.0),
        ]

        from src.data.anomaly import detect_anomalies
        alerts = detect_anomalies(date(2026, 5, 13))

        assert alerts[0]["severity"] == "critical"
        assert alerts[0]["metric"] == "cpi"


def test_detect_anomalies_no_alert():
    with patch("src.data.anomaly.get_clickhouse_client") as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.query.return_value.result_rows = []

        from src.data.anomaly import detect_anomalies
        alerts = detect_anomalies(date(2026, 5, 13))

        assert len(alerts) == 0
