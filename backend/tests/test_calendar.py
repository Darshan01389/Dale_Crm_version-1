import pytest
from datetime import datetime, timedelta
from app.core.security import hash_password

def test_calendar_crud(client, db):
    # 1. Create a user
    from app.models.user import User
    hashed = hash_password("CalPassword123")
    user = User(
        name="Calendar Tester",
        email="cal@dealcrm.com",
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
        "email": "cal@dealcrm.com",
        "password": "CalPassword123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Event
    now = datetime.utcnow()
    start_time = now + timedelta(hours=1)
    end_time = now + timedelta(hours=2)
    
    payload = {
        "title": "Meeting with Client",
        "description": "Discussing the proposal",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "event_type": "meeting",
        "is_all_day": False
    }
    
    response = client.post("/calendar/events", json=payload, headers=headers)
    assert response.status_code == 201
    event_data = response.json()
    assert event_data["title"] == "Meeting with Client"
    assert event_data["event_type"] == "meeting"
    event_id = event_data["id"]

    # 3. List Events
    list_response = client.get("/calendar/events", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["id"] == event_id

    # 4. Get Event by ID
    get_response = client.get(f"/calendar/events/{event_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Meeting with Client"

    # 5. Update Event
    update_payload = {
        "title": "Updated Meeting Title",
        "event_type": "call"
    }
    patch_response = client.patch(f"/calendar/events/{event_id}", json=update_payload, headers=headers)
    assert patch_response.status_code == 200
    assert patch_response.json()["title"] == "Updated Meeting Title"
    assert patch_response.json()["event_type"] == "call"

    # 6. Delete Event
    delete_response = client.delete(f"/calendar/events/{event_id}", headers=headers)
    assert delete_response.status_code == 204

    # 7. Verify Deleted
    get_deleted = client.get(f"/calendar/events/{event_id}", headers=headers)
    assert get_deleted.status_code == 404
