import pytest
import uuid
from app.core.security import hash_password
from app.models.lead import Lead

def test_whatsapp_simulator_and_settings(client, db):
    # 1. Create a Sales Rep User
    from app.models.user import User
    hashed = hash_password("RepPassword123")
    user = User(
        name="Rep User",
        email="rep@whatsapptest.com",
        password_hash=hashed,
        role="Sales Rep",
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Login to retrieve token
    login_response = client.post("/auth/login", json={
        "email": "rep@whatsapptest.com",
        "password": "RepPassword123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update WhatsApp Number settings
    settings_payload = {
        "whatsapp_number": "+919999999999"
    }
    put_response = client.put("/api/whatsapp/settings/number", json=settings_payload, headers=headers)
    assert put_response.status_code == 200
    assert put_response.json()["whatsapp_number"] == "+919999999999"

    # Get WhatsApp settings number
    get_num_response = client.get("/api/whatsapp/settings/number", headers=headers)
    assert get_num_response.status_code == 200
    assert get_num_response.json()["whatsapp_number"] == "+919999999999"

    # 3. Create a Lead
    lead = Lead(
        title="WhatsApp Prospect",
        email="whatsappprospect@example.com",
        phone="+918888888888",
        status="new",
        source="Website",
        owner_id=user.id
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # 4. Simulate a WhatsApp message incoming from the lead
    sim_payload = {
        "lead_id": str(lead.id),
        "lead_message": "Hello, I am interested in DaleIQ. Can you help?",
        "company_number": "+919999999999",
        "lead_number": "+918888888888"
    }
    sim_response = client.post("/api/whatsapp/simulate", json=sim_payload, headers=headers)
    assert sim_response.status_code == 200
    assert sim_response.json()["status"] == "ok"
    assert "reply" in sim_response.json()
    assert "summary" in sim_response.json()

    # 5. Fetch WhatsApp timeline history for lead
    hist_response = client.get(f"/api/whatsapp/history/{lead.id}", headers=headers)
    assert hist_response.status_code == 200
    hist_data = hist_response.json()
    assert hist_data["lead_id"] == str(lead.id)
    assert hist_data["count"] == 2 # 1 inbound + 1 outbound
    assert hist_data["messages"][0]["direction"] == "inbound"
    assert hist_data["messages"][0]["message"] == "Hello, I am interested in DaleIQ. Can you help?"
    assert hist_data["messages"][1]["direction"] == "outbound"
