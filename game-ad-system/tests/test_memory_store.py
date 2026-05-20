from datetime import date
from unittest.mock import patch, MagicMock


def test_campaign_case_schema():
    from src.memory.schemas import CampaignCase, CampaignResult, KeyDecision

    case = CampaignCase(
        campaign_id="camp_001",
        objective="ROAS >= 0.8",
        budget=5000.0,
        country="US",
        platform="iOS",
        creative_tags=["真人讲解", "战斗画面"],
        final_result=CampaignResult(roas=1.2, total_installs=3200, total_spend=4800.0),
        key_decisions=[
            KeyDecision(day=3, action="将预算从A组调到B组", reason="B组CTR高出40%"),
        ],
        lessons_learned="真人讲解类素材在US市场ROAS表现最佳",
    )
    assert case.campaign_id == "camp_001"
    assert case.final_result.roas == 1.2


def test_case_to_document():
    from src.memory.schemas import CampaignCase, CampaignResult

    case = CampaignCase(
        campaign_id="camp_001",
        objective="ROAS >= 0.8",
        budget=5000.0,
        country="US",
        platform="iOS",
        creative_tags=["真人讲解"],
        final_result=CampaignResult(roas=1.2, total_installs=3200, total_spend=4800.0),
        key_decisions=[],
        lessons_learned="测试经验",
    )
    doc = case.to_document()
    assert "camp_001" in doc
    assert "US" in doc
    assert "真人讲解" in doc


def test_store_case():
    import sys

    mock_chroma = MagicMock()
    sys.modules["chromadb"] = mock_chroma

    # Force reimport with mocked chromadb
    if "src.memory.store" in sys.modules:
        del sys.modules["src.memory.store"]

    from src.memory.store import MemoryStore
    from src.memory.schemas import CampaignCase, CampaignResult

    mock_collection = MagicMock()
    mock_client = MagicMock()
    mock_client.get_or_create_collection.return_value = mock_collection
    mock_chroma.PersistentClient.return_value = mock_client

    store = MemoryStore()
    case = CampaignCase(
        campaign_id="camp_001",
        objective="ROAS >= 0.8",
        budget=5000.0,
        country="US",
        platform="iOS",
        creative_tags=["真人讲解"],
        final_result=CampaignResult(roas=1.2, total_installs=3200, total_spend=4800.0),
        key_decisions=[],
        lessons_learned="测试",
    )

    store.save_case(case)
    mock_collection.add.assert_called_once()
