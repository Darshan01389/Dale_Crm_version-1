import pytest
import uuid
from app.core.security import hash_password
from app.models.lead_source import LeadSource

def test_webhook_ingestion_and_logs(client, db):
    # 1. Create admin user
    from app.models.user import User
    hashed = hash_password("AdminPassword123")
    user = User(
        name="Admin User",
        email="admin@dealcrm.com",
        role="Owner / Admin",
        password_hash=hashed,
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Login to retrieve token
    login_response = client.post("/auth/login", json={
        "email": "admin@dealcrm.com",
        "password": "AdminPassword123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create LeadSource
    source = LeadSource(
        name="Custom Hook",
        platform_type="Custom",
        status="Connected",
        is_active=True,
        field_mapping={
            "full_name": "lead_name",
            "contact_email": "email",
            "contact_phone": "phone"
        }
    )
    db.add(source)
    db.commit()
    db.refresh(source)

    # 3. Post a Webhook request to /webhooks/{source_id}
    webhook_payload = {
        "full_name": "Webhook Lead",
        "contact_email": "webhook@lead.com",
        "contact_phone": "+919999999999"
    }
    
    response = client.post(f"/webhooks/{source.id}", json=webhook_payload)
    assert response.status_code == 202
    assert response.json()["status"] == "success"
    
    # 4. Get Webhook Logs
    logs_response = client.get("/webhooks/logs", headers=headers)
    assert logs_response.status_code == 200
    logs = logs_response.json()
    assert len(logs) == 1
    assert logs[0]["status"] == "Processed"
    assert logs[0]["source_name"] == "Custom Hook"
    assert logs[0]["payload"]["full_name"] == "Webhook Lead"
