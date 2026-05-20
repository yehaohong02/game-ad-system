from datetime import datetime


def test_creative_tags_schema():
    from src.creative.schemas import CreativeTags

    tags = CreativeTags(
        video_id="v_001",
        visual_tags=["真人讲解", "战斗画面"],
        audio_tags=["激昂BGM"],
        text_keywords=["免费100抽"],
        duration_seconds=30,
    )
    assert tags.video_id == "v_001"
    assert len(tags.visual_tags) == 2
    assert tags.generated_at is not None


def test_element_ranking_schema():
    from src.creative.schemas import ElementRanking

    ranking = ElementRanking(
        tag="真人+战斗",
        avg_roas=1.8,
        avg_ctr=0.025,
        avg_ipm=15.0,
        sample_size=120,
    )
    assert ranking.avg_roas == 1.8
    assert ranking.sample_size == 120
