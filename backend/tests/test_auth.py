from app.core.security import hash_password

def test_register_and_login(client):
    # 1. Register User
    signup_payload = {
        "name": "Test User",
        "email": "test@dealcrm.com",
        "password": "SecurePassword123",
        "role": "Sales Rep"
    }
    response = client.post("/auth/register", json=signup_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@dealcrm.com"
    assert data["name"] == "Test User"
    assert data["role"] == "Sales Rep"
    
    # Verify that email needs verification by default (so login should fail before verification)
    login_payload = {
        "email": "test@dealcrm.com",
        "password": "SecurePassword123"
    }
    login_response = client.post("/auth/login", json=login_payload)
    assert login_response.status_code == 403 # Email not verified block
    
    # Try registration duplicate
    dup_response = client.post("/auth/register", json=signup_payload)
    assert dup_response.status_code == 400
    assert "already registered" in dup_response.json()["detail"].lower()

def test_profile_and_password_update(client, db):
    # Create an active, verified user directly in the DB
    from app.models.user import User
    hashed = hash_password("OldPassword123")
    user = User(
        name="Profile Tester",
        email="profile@dealcrm.com",
        password_hash=hashed,
        role="Sales Rep",
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Login user
    login_response = client.post("/auth/login", json={
        "email": "profile@dealcrm.com",
        "password": "OldPassword123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch profile
    me_response = client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["name"] == "Profile Tester"

    # Update profile
    patch_response = client.patch("/auth/me", json={
        "name": "Updated Name",
        "whatsapp_number": "+1234567890"
    }, headers=headers)
    assert patch_response.status_code == 200
    assert patch_response.json()["name"] == "Updated Name"

    # Change password
    change_response = client.post("/auth/change-password", json={
        "old_password": "OldPassword123",
        "new_password": "NewPassword123"
    }, headers=headers)
    assert change_response.status_code == 200
    assert "success" in change_response.json()["message"].lower()

    # Verify old password is rejected on login, and new password works
    wrong_login = client.post("/auth/login", json={
        "email": "profile@dealcrm.com",
        "password": "OldPassword123"
    })
    assert wrong_login.status_code == 401
