"""
Academic Verification Suite: Test Full Pipeline End-to-End.
Validates the complete autonomous revenue execution cycle:
  Inbound Webhook -> WebRTC Call & Acoustic Prosody -> Auto-Move -> Cryptographic Invoice & ERP Sync
per Section 6 of DalelQ Master Implementation Plan.
"""

import pytest
import os
from fastapi.testclient import TestClient
from main import app
from app.services.erp_service import erp_service
from app.services.email_copilot import email_copilot
from app.ml.acoustic_engine import acoustic_engine
from app.ml.xai_service import xai_service
from app.ml.rfm_engine import rfm_engine

client = TestClient(app)

def test_full_pipeline_lifecycle():
    """
    Simulates the entire autonomous lifecycle:
    1. Ingestion: Inbound lead inquiry with transcript & budget.
    2. Streaming Audio Analysis: Acoustic prosody extraction & Customer Hesitation Index (CHI).
    3. XAI Attribution: Mathematical SHAP decomposition S(x) = phi_0 + sum(phi_i).
    4. Generative Copilot: 1-Click Executive Proposal generation for WhatsApp/Email.
    5. Closed-Loop ERP Settlement: Deal stage moved to Won -> SHA-256 PDF Smart Contract,
       dynamic Razorpay UPI QR code, and outbound ERP webhooks.
    """
    lead_id = "test-lead-enterprise-01"
    deal_id = "test-deal-revenue-99"

    # Step 1: Acoustic Prosody Extraction (Pillar 1)
    spr = 2.1
    sigma_f0 = 32.0
    wpm = 138.0
    chi = acoustic_engine.calculate_chi(spr=spr, sigma_f0=sigma_f0, wpm=wpm)
    assert 0.0 <= chi <= 1.0
    assert chi < 0.40, "Fluent conversational speech should have low hesitation"

    # Step 2: Glass-Box XAI Feature Attribution (Pillar 2)
    lead_dict = {
        "id": lead_id,
        "title": "Aditi Roy (VP Commercials)",
        "occupation": "VP Commercials",
        "deal_value": 750000.0,
        "website_visits": 6,
        "stagnation_days": 2,
        "chi_score": chi,
        "notes": "Verified Decision Maker. High urgency for softphone and ERP settlement."
    }
    xai_res = xai_service.compute_lead_attribution(lead_dict)
    assert xai_res.total_score > 70.0
    assert abs(xai_res.base_score + xai_res.marginal_sum - xai_res.total_score) < 1e-4

    # Step 3: Generative Proposal Copilot (Pillar 4)
    proposal = email_copilot.generate_proposal(
        lead_data=lead_dict,
        transcripts=[
            "We are looking for a platform with zero per-seat tax.",
            "Our budget is around 7.5 lakhs annually.",
            "Can you support instant UPI QR codes for invoices?"
        ],
        tier="custom"
    )
    assert proposal.annual_contract_value_inr >= 750000.0
    assert "WhatsApp" in proposal.channel_templates
    assert "Email" in proposal.channel_templates
    assert "SMS" in proposal.channel_templates
    assert "0% per-seat tax" in proposal.identified_objections_handled[0]

    # Step 4: Closed-Won Smart Settlement & ERP Sync (Pillar 6)
    settlement = erp_service.process_closed_won_deal(
        deal_id=deal_id,
        deal_title="Aditi Roy — Autonomous Revenue OS Deployment",
        company_name="Aditi Roy Enterprises",
        amount_inr=750000.0
    )

    # Validate Cryptographic SHA-256 Hash
    assert settlement.contract_sha256 is not None
    assert len(settlement.contract_sha256) == 64, "SHA-256 hex digest must be exactly 64 characters."

    # Validate PDF File Exists & Hash Matches
    pdf_filename = f"{settlement.contract_number}.pdf"
    pdf_full_path = os.path.join(erp_service.contracts_dir, pdf_filename)
    assert os.path.exists(pdf_full_path), "Generated PDF contract must exist on filesystem."
    with open(pdf_full_path, "rb") as f:
        actual_hash = os.popen(f'certutil -hashfile "{pdf_full_path}" SHA256').read()
        # Alternatively compute in python:
        import hashlib
        assert hashlib.sha256(f.read()).hexdigest() == settlement.contract_sha256

    # Validate Dynamic Razorpay UPI QR and Stripe Checkout
    assert "upi://pay?" in settlement.razorpay_upi_uri
    assert "am=885000.00" in settlement.razorpay_upi_uri  # 750,000 + 18% GST = 885,000
    assert "<svg" in settlement.razorpay_qr_svg
    assert "stripe.com" in settlement.stripe_checkout_url

    # Validate Outbound ERP Webhooks
    erp_names = [e.erp_system for e in settlement.erp_sync_status]
    assert "SAP S/4HANA Cloud" in erp_names
    assert "Oracle NetSuite ERP" in erp_names
    assert "Odoo v17 Enterprise" in erp_names
    for webhook in settlement.erp_sync_status:
        assert webhook.status == "SUCCESS"
        assert webhook.http_code in [200, 201]

def test_api_endpoints_integration():
    """Validates public API endpoints for DalelQ NextGen."""
    # 1. Acoustic analysis endpoint
    res_ac = client.post("/api/voice/acoustic-analysis", json={"spr": 2.5, "sigma_f0": 30.0, "wpm": 140.0})
    assert res_ac.status_code == 200
    assert "chi" in res_ac.json()

    # 2. Live HUD endpoint
    res_hud = client.post("/api/voice/live-hud", json={
        "transcript_chunk": "Competitor X pricing is lower than your proposal.",
        "chi": 0.60
    })
    assert res_hud.status_code == 200
    data_hud = res_hud.json()
    assert data_hud["has_battlecard"] is True
    assert "0% per-seat tax" in data_hud["battlecard"]["whisper_action"]

    # 3. Topic Mining endpoint
    res_topics = client.get("/api/ml/topics/mining?simulate_spike=true")
    assert res_topics.status_code == 200
    data_topics = res_topics.json()
    assert len(data_topics["clusters"]) == 6
    assert data_topics["anomaly_spike"]["z_score"] > 2.5
    assert data_topics["anomaly_spike"]["has_anomaly"] is True
