import pytest
import uuid
import json
from app.core.security import hash_password
from app.models.company import Company
from app.models.billing import SubscriptionPlan, CompanySubscription, Invoice

def test_billing_flows(client, db):
    # 1. Create a Company and an Admin User
    company = Company(
        name="Billing Test Corp",
        join_code="CORP123"
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    from app.models.user import User
    hashed = hash_password("BillPass123")
    user = User(
        name="Billing Owner",
        email="owner@billingtest.com",
        password_hash=hashed,
        role="Owner / Admin",
        company_id=company.id,
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Login to retrieve token
    login_response = client.post("/auth/login", json={
        "email": "owner@billingtest.com",
        "password": "BillPass123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Subscription Plans
    plans_response = client.get("/billing/plans")
    assert plans_response.status_code == 200
    plans = plans_response.json()
    assert len(plans) > 0
    # Find the Pro plan ID or just use first plan
    plan_id = plans[0]["id"]

    # 3. Get Subscription Status (should return default basic mock)
    status_response = client.get("/billing/status", headers=headers)
    assert status_response.status_code == 200
    assert status_response.json()["status"] in ["pending", "active"]

    # 4. Subscribe (Initialize gateway checkout session)
    subscribe_payload = {
        "plan_id": plan_id,
        "gateway": "stripe"
    }
    sub_response = client.post("/billing/subscribe", json=subscribe_payload, headers=headers)
    assert sub_response.status_code == 200
    sub_data = sub_response.json()
    assert sub_data["gateway"] == "stripe"
    gateway_order_id = sub_data["stripe_session_id"] # checkout session ID

    # 5. Simulate Webhook Payment Success via Stripe sandbox webhook
    stripe_webhook_payload = {
        "session_id": gateway_order_id
    }
    webhook_headers = {
        "stripe-signature": "sandbox_signature"
    }
    webhook_response = client.post(
        "/billing/webhook/stripe",
        data=json.dumps(stripe_webhook_payload),
        headers=webhook_headers
    )
    assert webhook_response.status_code == 200
    assert webhook_response.json()["status"] == "success"

    # Verify CompanySubscription is now active
    status_response = client.get("/billing/status", headers=headers)
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "active"

    # 6. List Invoices
    invoices_response = client.get("/billing/invoices", headers=headers)
    assert invoices_response.status_code == 200
    invoices = invoices_response.json()
    assert len(invoices) == 1
    invoice_id = invoices[0]["id"]

    # 7. Download PDF Invoice
    download_response = client.get(f"/billing/invoices/{invoice_id}/download", headers=headers)
    assert download_response.status_code == 200
    assert download_response.headers["content-type"] == "application/pdf"
