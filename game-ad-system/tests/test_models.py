from datetime import date


def test_ad_performance_model():
    from src.shared.models.ad import AdPerformance

    record = AdPerformance(
        date=date(2026, 5, 14),
        ad_account_id="act_123",
        campaign_id="camp_1",
        ad_set_id="adset_1",
        ad_id="ad_1",
        creative_id="cr_1",
        country="US",
        platform="iOS",
        impressions=10000,
        clicks=500,
        spend=250.0,
        installs=50,
        revenue=300.0,
        roi=1.2,
    )
    assert record.roi == 1.2
    assert record.cpi == 5.0


def test_ad_performance_cpi_zero_installs():
    from src.shared.models.ad import AdPerformance

    record = AdPerformance(
        date=date(2026, 5, 14),
        ad_account_id="act_123",
        campaign_id="camp_1",
        ad_set_id="adset_1",
        ad_id="ad_1",
        creative_id="cr_1",
        country="US",
        platform="iOS",
        impressions=10000,
        clicks=500,
        spend=250.0,
        installs=0,
        revenue=0.0,
        roi=0.0,
    )
    assert record.cpi == 0.0


def test_alert_model():
    from src.shared.models.ad import Alert

    alert = Alert(
        date=date(2026, 5, 14),
        campaign_id="camp_1",
        metric="spend",
        current_value=500.0,
        avg_7d=300.0,
        deviation_pct=66.67,
        severity="critical",
    )
    assert alert.severity == "critical"
