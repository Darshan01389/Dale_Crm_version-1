"""
Academic Verification Suite: Test Dual-Horizon RFM Engine.
Validates quintile boundary mathematics (1 <= R, F, M <= 5),
10 behavioral segment classifications, and Pareto/NBD CLV calculations
per Pillar 3 of DalelQ Master Implementation Plan.
"""

import pytest
from app.ml.rfm_engine import rfm_engine, SEGMENT_DEFINITIONS

def test_quintile_boundaries():
    """Validates that compute_quintile strictly maps values into integer bounds [1, 5]."""
    thresholds = [10.0, 25.0, 50.0, 100.0]

    # Testing ascending boundaries
    assert rfm_engine.compute_quintile(5.0, thresholds) == 1
    assert rfm_engine.compute_quintile(15.0, thresholds) == 2
    assert rfm_engine.compute_quintile(30.0, thresholds) == 3
    assert rfm_engine.compute_quintile(75.0, thresholds) == 4
    assert rfm_engine.compute_quintile(150.0, thresholds) == 5

    # Testing inverted boundaries (for Recency days, where lower is better)
    assert rfm_engine.compute_quintile(5.0, thresholds, invert=True) == 5
    assert rfm_engine.compute_quintile(15.0, thresholds, invert=True) == 4
    assert rfm_engine.compute_quintile(30.0, thresholds, invert=True) == 3
    assert rfm_engine.compute_quintile(75.0, thresholds, invert=True) == 2
    assert rfm_engine.compute_quintile(150.0, thresholds, invert=True) == 1

def test_10_behavioral_segments_coverage():
    """Validates that all 10 academic behavioral segments can be assigned."""
    expected_segments = {s["name"] for s in SEGMENT_DEFINITIONS}
    assert len(expected_segments) == 10

    # Test key archetypes
    # 1. Champions (R=5, F=5, M=5)
    champ = rfm_engine.classify_segment(5, 5, 5)
    assert champ["name"] == "Champions"
    assert champ["action"] == "Upsell Enterprise & Referral Program"
    assert champ["trigger"] == "Executive Review Invite"

    # 2. Potential Loyalists (R=4-5, F=3-4, M=3-4)
    pot_loy = rfm_engine.classify_segment(4, 3, 3)
    assert pot_loy["name"] == "Potential Loyalists"
    assert pot_loy["trigger"] == "Automated WhatsApp Offer"

    # 3. At-Risk Churners (R=1-2, F=4-5, M=4-5)
    at_risk = rfm_engine.classify_segment(1, 4, 4)
    assert at_risk["name"] == "At-Risk Churners"
    assert at_risk["trigger"] == "Instant Manager Call Task"

    # 4. Cannot Lose Them (R=1-2, F=4-5, M=5)
    cannot_lose = rfm_engine.classify_segment(1, 4, 5)
    assert cannot_lose["name"] == "Cannot Lose Them"
    assert cannot_lose["trigger"] == "C-Suite Personal Outreach"

    # 5. Hibernating (R=1-2, F=1-2, M=1-2)
    hib = rfm_engine.classify_segment(1, 1, 1)
    assert hib["name"] == "Hibernating"
    assert hib["trigger"] == "Low-Touch Email Campaign"

def test_rfm_heatmap_at_risk_revenue_calculation():
    """Validates that the RFM engine aggregates total portfolio value and at-risk revenue accurately."""
    accounts = [
        {"id": "a1", "name": "Firm A", "recency_days": 3, "frequency_count": 15, "monetary_value": 1000000.0},
        {"id": "a2", "name": "Firm B", "recency_days": 95, "frequency_count": 10, "monetary_value": 800000.0},  # At-risk
        {"id": "a3", "name": "Firm C", "recency_days": 120, "frequency_count": 1, "monetary_value": 150000.0}, # Hibernating/Lost
    ]

    report = rfm_engine.analyze_accounts(accounts)
    assert report.total_accounts == 3
    assert report.total_portfolio_value == 1950000.0
    assert report.total_at_risk_revenue >= 950000.0
    assert report.at_risk_account_count >= 2
    assert len(report.segments) == 10

def test_pareto_nbd_clv_positivity():
    """Validates that Pareto/NBD CLV produces non-negative, logically consistent lifetime values."""
    clv_high = rfm_engine.compute_clv_pareto_nbd(monetary=500000.0, frequency=8, recency_days=5)
    clv_dormant = rfm_engine.compute_clv_pareto_nbd(monetary=500000.0, frequency=8, recency_days=150)

    assert clv_high > 0
    assert clv_dormant > 0
    assert clv_high > clv_dormant, "Active customer should have strictly higher expected CLV than dormant customer."
