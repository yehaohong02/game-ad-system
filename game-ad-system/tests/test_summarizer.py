from unittest.mock import patch, MagicMock


def test_summarize_campaign():
    mock_response = MagicMock()
    mock_response.content = """{
        "objective": "ROAS >= 0.8",
        "budget": 5000.0,
        "country": "US",
        "platform": "iOS",
        "creative_tags": ["真人讲解"],
        "final_result": {"roas": 1.2, "total_installs": 3200, "total_spend": 4800.0},
        "key_decisions": [],
        "lessons_learned": "真人讲解素材在美国iOS市场表现优异"
    }"""

    mock_chain = MagicMock()
    mock_chain.invoke.return_value = mock_response

    with patch("src.memory.summarizer.ChatOpenAI"), \
         patch("src.memory.summarizer.ChatPromptTemplate") as mock_prompt_cls:
        mock_prompt_cls.from_template.return_value.__or__ = MagicMock(return_value=mock_chain)

        from src.memory.summarizer import summarize_campaign

        case = summarize_campaign(
            campaign_id="camp_001",
            performance_data={"spend": 4800, "installs": 3200, "revenue": 5760},
        )
        assert case.campaign_id == "camp_001"
