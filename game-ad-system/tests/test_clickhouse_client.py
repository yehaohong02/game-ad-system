from unittest.mock import patch, MagicMock

import src.shared.db.clickhouse as clickhouse_module


def test_get_client_returns_singleton():
    # Reset singleton state from any prior import
    clickhouse_module._client = None

    mock_client = MagicMock()
    with patch.object(clickhouse_module, "clickhouse_connect") as mock_ch:
        mock_ch.get_client.return_value = mock_client

        from src.shared.db.clickhouse import get_clickhouse_client

        client1 = get_clickhouse_client()
        client2 = get_clickhouse_client()

        assert client1 is client2
        assert mock_ch.get_client.call_count == 1


def test_init_tables_calls_command():
    # Reset singleton state
    clickhouse_module._client = None

    mock_client = MagicMock()
    with patch.object(clickhouse_module, "clickhouse_connect") as mock_ch:
        mock_ch.get_client.return_value = mock_client

        from src.shared.db.clickhouse import init_tables
        init_tables()

        assert mock_client.command.call_count == 2
