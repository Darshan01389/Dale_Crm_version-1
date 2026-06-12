from app.core.security import hash_password

def test_leads_crud_and_duplicates(client, db):
    # 1. Create and verify user in DB
    from app.models.user import User
    hashed = hash_password("LeadPassword123")
    user = User(
        name="Lead Manager",
        email="manager@dealcrm.com",
        password_hash=hashed,
        role="Owner / Admin",
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Login to retrieve token
    login_response = client.post("/auth/login", json={
        "email": "manager@dealcrm.com",
        "password": "LeadPassword123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Lead
    lead_payload = {
        "title": "Fresh Prospect",
        "email": "prospect@example.com",
        "phone": "+918888888888",
        "status": "new",
        "source": "Website"
    }
    response = client.post("/leads", json=lead_payload, headers=headers)
    assert response.status_code == 201
    lead_data = response.json()
    assert lead_data["title"] == "Fresh Prospect"
    assert lead_data["email"] == "prospect@example.com"

    # 3. Create Duplicate Lead (Conflict validation check)
    dup_response = client.post("/leads", json=lead_payload, headers=headers)
    assert dup_response.status_code == 409
    assert "already exists" in dup_response.json()["detail"].lower()

    # 4. Search and filter leads list
    search_response = client.get("/leads?search=Fresh", headers=headers)
    assert search_response.status_code == 200
    assert len(search_response.json()) == 1
    assert search_response.json()[0]["title"] == "Fresh Prospect"

    # Search with no matches
    empty_search = client.get("/leads?search=NonExistent", headers=headers)
    assert empty_search.status_code == 200
    assert len(empty_search.json()) == 0
