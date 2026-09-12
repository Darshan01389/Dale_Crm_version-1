"""
Academic Verification Suite: Test XAI Lead Scoring (SHAP Engine).
Validates exact mathematical additivity constraint:
  S(x) = phi_0 + sum_{i=1}^M phi_i
Validates exact sum of SHAP marginals per Pillar 2 of DalelQ Master Implementation Plan.
"""

import pytest
from app.ml.xai_service import xai_service, XAIService

def test_exact_sum_of_shap_marginals():
    """
    Validates that the total lead score S(x) strictly equals the base expected value
    phi_0 plus the exact sum of all marginal feature attributions phi_i.
    """
    test_leads = [
        {
            "id": "lead-dm-budget",
            "title": "Aarav Sharma (VP Engineering)",
            "occupation": "VP of Technology",
            "deal_value": 750000.0,
            "website_visits": 8,
            "stagnation_days": 2,
            "chi_score": 0.28,
            "notes": "Decision Maker verified. Explicit budget identified."
        },
        {
            "id": "lead-stagnant-hesitant",
            "title": "Vikram Patel",
            "occupation": "Product Manager",
            "deal_value": 85000.0,
            "website_visits": 0,
            "stagnation_days": 14,
            "chi_score": 0.68,
            "notes": "Hesitant prospect. No budget confirmed."
        },
        {
            "id": "lead-neutral-midlevel",
            "title": "Meera Iyer",
            "occupation": "Operations Lead",
            "deal_value": 250000.0,
            "website_visits": 3,
            "stagnation_days": 6,
            "chi_score": 0.44,
            "notes": "Standard evaluation ongoing."
        }
    ]

    for lead in test_leads:
        attribution = xai_service.compute_lead_attribution(lead)

        # 1. Mathematical Additivity Property
        phi_0 = attribution.base_score
        marginal_sum = sum(a.marginal_contribution for a in attribution.attributions)
        total_calculated = round(phi_0 + marginal_sum, 1)

        assert abs(total_calculated - attribution.total_score) < 1e-4, (
            f"Additivity violated for {lead['id']}: phi_0 ({phi_0}) + sum ({marginal_sum}) != S(x) ({attribution.total_score})"
        )

        # 2. Check feature attributions are present
        feature_keys = [a.feature_key for a in attribution.attributions]
        assert "decision_maker" in feature_keys
        assert "bant_budget" in feature_keys
        assert "stagnation" in feature_keys
        assert "acoustic_tone" in feature_keys
        assert "website_intent" in feature_keys

def test_decision_maker_and_budget_attributions():
    """Validates specific benchmark values: +32.5 pts for VP/Director, +18.0 pts for budget > 500k."""
    lead = {
        "id": "lead-exec",
        "title": "Rajesh Gupta (Director of Operations)",
        "occupation": "Director",
        "deal_value": 600000.0,
        "website_visits": 5,
        "stagnation_days": 12,
        "chi_score": 0.60
    }
    attribution = xai_service.compute_lead_attribution(lead)
    attr_map = {a.feature_key: a for a in attribution.attributions}

    assert attr_map["decision_maker"].marginal_contribution == 32.5
    assert attr_map["bant_budget"].marginal_contribution == 18.0
    assert attr_map["stagnation"].marginal_contribution == -16.2
    assert attr_map["acoustic_tone"].marginal_contribution == -11.4

def test_actionable_remediation_generation():
    """Validates that negative penalty bars produce actionable AI re-engagement playbooks."""
    stagnation_rem = xai_service.generate_remediation_sequence("stagnation", "Kavita Rao", "Tata Retail")
    assert stagnation_rem["sequence_name"] == "Pipeline Revival Sequence"
    assert "WhatsApp" in stagnation_rem["channel"]
    assert "Kavita Rao" in stagnation_rem["template"]

    tone_rem = xai_service.generate_remediation_sequence("acoustic_tone", "Anil Mehta", "Infosys")
    assert "Risk Elimination" in tone_rem["sequence_name"]
    assert "99.99% uptime SLA" in tone_rem["template"]
