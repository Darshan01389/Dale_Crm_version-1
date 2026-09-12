from app.core.security import hash_password

def test_enterprise_features_suite(client, db):
    # 1. Setup an authenticated user
    from app.models.user import User
    hashed = hash_password("EnterprisePass123")
    user = User(
        name="Enterprise Admin",
        email="enterprise_admin@dealcrm.com",
        password_hash=hashed,
        role="Owner / Admin",
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Login
    login_res = client.post("/auth/login", json={
        "email": "enterprise_admin@dealcrm.com",
        "password": "EnterprisePass123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Leads CSV Export
    leads_export_res = client.get("/leads/export/csv", headers=headers)
    assert leads_export_res.status_code == 200
    assert "text/csv" in leads_export_res.headers.get("content-type", "")
    assert "Lead ID" in leads_export_res.text

    # 3. Test Deals CSV Export
    deals_export_res = client.get("/deals/export/csv", headers=headers)
    assert deals_export_res.status_code == 200
    assert "text/csv" in deals_export_res.headers.get("content-type", "")
    assert "Deal ID" in deals_export_res.text

    # 4. Test Analytics Leaderboard & Gamification
    leaderboard_res = client.get("/analytics/leaderboard", headers=headers)
    assert leaderboard_res.status_code == 200
    leaderboard_data = leaderboard_res.json()
    assert "leaderboard" in leaderboard_data
    assert "current_user_stats" in leaderboard_data
    assert leaderboard_data["quota_target_default"] == 500000.0

    # 5. Test Live Call Objection Detection & Battlecard Generation
    objection_res = client.post("/voice/detect-objection", json={
        "text": "Your price is too high compared to the other vendor.",
        "prospect_name": "Test Prospect"
    }, headers=headers)
    assert objection_res.status_code == 200
    objection_data = objection_res.json()
    assert len(objection_data["battlecards"]) > 0
    assert objection_data["battlecards"][0]["type"] == "PRICING_OBJECTION"
    assert "rebuttal script" in str(objection_data).lower() or "script" in objection_data["battlecards"][0]

    # 6. Test Two-Way Inbound Email Processing & Sentiment Scoring
    email_inbound_res = client.post("/activities/email-inbound", json={
        "sender_email": "prospect@acmecorp.com",
        "subject": "Enterprise Deal Inquiry",
        "body": "We love your product architecture and would like to sign an annual contract!"
    }, headers=headers)
    assert email_inbound_res.status_code == 201
    email_data = email_inbound_res.json()
    assert email_data["status"] == "success"
    assert email_data["sentiment"] in ["positive", "neutral", "negative"]

    # 7. Test Drip Sequence Simulation
    from app.models.automation_rule import AutomationRule
    rule = AutomationRule(
        name="Test Inbound Drip",
        conditions=[{"field": "source", "operator": "equals", "value": "Website"}],
        action_type="drip_sequence",
        action_payload={
            "steps": [
                {"step": 1, "channel": "whatsapp", "delay_days": 0, "template": "Immediate Welcome"},
                {"step": 2, "channel": "email", "delay_days": 2, "template": "Follow-up Case Study"}
            ]
        }
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    sim_res = client.post(f"/automation/rules/{rule.id}/simulate", headers=headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["total_touches"] == 2
    assert len(sim_data["sequence_timeline"]) == 2
    assert sim_data["sequence_timeline"][0]["scheduled_time"] == "Day 1"
    assert sim_data["sequence_timeline"][1]["scheduled_time"] == "Day 3"
