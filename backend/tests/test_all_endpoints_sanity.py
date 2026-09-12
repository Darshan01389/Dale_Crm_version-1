import pytest
from app.models.user import User
from app.models.lead import Lead
from app.models.deal import Deal
from app.core.security import create_access_token

@pytest.fixture
def auth_headers(db):
    user = User(
        name="Test Lead Admin",
        email="test_lead_admin@dalecrm.com",
        role="Admin",
        password_hash="hashed_secret"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"Authorization": f"Bearer {token}"}

def test_all_dalelq_frontier_endpoints(client, auth_headers):
    # 1. XAI Attribution
    r = client.get("/api/ml/xai/attribution/test-lead-123", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "attributions" in data
    assert "total_score" in data

    # 2. XAI Remediate
    r = client.post("/api/ml/xai/remediate", json={"feature_key": "stagnation", "lead_name": "Rajesh Kumar"}, headers=auth_headers)
    assert r.status_code == 200
    assert "template" in r.json()

    # 3. RFM Heatmap
    r = client.get("/api/ml/rfm/heatmap", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()["segments"]) == 10

    # 4. Support Topic Mining
    r = client.get("/api/ml/topics/mining?simulate_spike=true", headers=auth_headers)
    assert r.status_code == 200
    mining = r.json()
    assert len(mining["clusters"]) == 6
    assert mining["anomaly_spike"]["has_anomaly"] is True

    # 5. Live HUD Copilot
    r = client.post("/api/voice/live-hud", json={
        "transcript_chunk": "Competitor X is offering this 30% cheaper",
        "chi": 0.55,
        "rep_talk_time_sec": 40.0,
        "prospect_talk_time_sec": 60.0
    }, headers=auth_headers)
    assert r.status_code == 200
    assert "battlecard" in r.json()

    # 6. Acoustic Analysis
    r = client.post("/api/voice/acoustic-analysis", json={"spr": 1.8, "sigma_f0": 24.0, "wpm": 135.0}, headers=auth_headers)
    assert r.status_code == 200
    assert "chi" in r.json()

    # 7. Executive Proposal
    r = client.post("/api/copilot/proposal", json={"tier": "professional"}, headers=auth_headers)
    assert r.status_code == 200
    assert "annual_contract_value_inr" in r.json()

    # 8. Deal Smart Settlement
    r = client.post("/api/erp/settle/test-deal-999", headers=auth_headers)
    assert r.status_code == 200
    settle = r.json()
    assert "contract_sha256" in settle
    assert "razorpay_qr_svg" in settle

def test_core_crm_endpoints(client, auth_headers):
    # Leads list
    r = client.get("/api/leads", headers=auth_headers)
    assert r.status_code == 200

    # Deals list
    r = client.get("/api/deals", headers=auth_headers)
    assert r.status_code == 200

    # Companies list
    r = client.get("/api/company", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    # Teams list
    r = client.get("/api/teams", headers=auth_headers)
    assert r.status_code == 200

    # Analytics dashboard
    r = client.get("/api/analytics/dashboard?date_range=30%20Days", headers=auth_headers)
    assert r.status_code == 200
