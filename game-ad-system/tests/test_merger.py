from datetime import date


def test_merge_left_join():
    from src.data.merger import merge_and_clean

    meta_records = [
        {"campaign_id": "c1", "ad_set_id": "s1", "ad_id": "a1", "creative_id": "cr1",
         "impressions": 1000, "clicks": 50, "spend": 100.0, "installs": 10},
    ]
    af_records = [
        {"campaign_id": "c1", "ad_set_id": "s1", "ad_id": "a1",
         "installs": 10, "revenue": 150.0, "country": "US", "platform": "ios"},
    ]

    result = merge_and_clean(meta_records, af_records, date(2026, 5, 13), "act_123")

    assert len(result) == 1
    assert result[0]["revenue"] == 150.0
    assert result[0]["roi"] == 1.5
    assert result[0]["ad_account_id"] == "act_123"


def test_merge_no_af_data():
    from src.data.merger import merge_and_clean

    meta_records = [
        {"campaign_id": "c1", "ad_set_id": "s1", "ad_id": "a1", "creative_id": "cr1",
         "impressions": 1000, "clicks": 50, "spend": 100.0, "installs": 10},
    ]

    result = merge_and_clean(meta_records, [], date(2026, 5, 13), "act_123")

    assert len(result) == 1
    assert result[0]["revenue"] == 0.0
    assert result[0]["country"] == ""
    assert result[0]["installs"] == 10


def test_merge_negative_roi():
    from src.data.merger import merge_and_clean

    meta_records = [
        {"campaign_id": "c1", "ad_set_id": "s1", "ad_id": "a1", "creative_id": "cr1",
         "impressions": 1000, "clicks": 50, "spend": 200.0, "installs": 10},
    ]
    af_records = [
        {"campaign_id": "c1", "ad_set_id": "s1", "ad_id": "a1",
         "installs": 10, "revenue": 50.0, "country": "US", "platform": "ios"},
    ]

    result = merge_and_clean(meta_records, af_records, date(2026, 5, 13), "act_123")

    assert result[0]["roi"] == 0.25
