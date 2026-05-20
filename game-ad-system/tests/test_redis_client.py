from unittest.mock import patch, MagicMock


def test_get_redis_returns_singleton():
    from src.shared.db import redis_client

    # Reset singleton so we get a fresh instance
    redis_client._redis_client = None

    with patch("src.shared.db.redis_client.redis") as mock_redis_mod:
        mock_conn = MagicMock()
        mock_redis_mod.Redis.return_value = mock_conn

        client1 = redis_client.get_redis_client()
        client2 = redis_client.get_redis_client()

        assert client1 is client2
        assert client1 is mock_conn
        mock_redis_mod.Redis.assert_called_once()
