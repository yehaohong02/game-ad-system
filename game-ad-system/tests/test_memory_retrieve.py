from unittest.mock import patch, MagicMock


def test_retrieve_similar_cases():
    mock_result = {
        "ids": [["camp_001", "camp_002"]],
        "documents": [["案例1文档", "案例2文档"]],
        "metadatas": [[
            {"campaign_id": "camp_001", "country": "US", "roas": 1.2},
            {"campaign_id": "camp_002", "country": "US", "roas": 0.9},
        ]],
        "distances": [[0.1, 0.3]],
    }

    with patch("src.memory.retrieve.chromadb") as mock_chroma:
        mock_collection = MagicMock()
        mock_collection.query.return_value = mock_result
        mock_client = MagicMock()
        mock_client.get_collection.return_value = mock_collection
        mock_chroma.PersistentClient.return_value = mock_client

        from src.memory.retrieve import retrieve_similar_cases

        results = retrieve_similar_cases(
            objective="ROAS >= 0.8",
            country="US",
            platform="iOS",
            creative_tags=["真人讲解"],
            top_k=2,
        )

        assert len(results) == 2
        assert results[0]["campaign_id"] == "camp_001"
