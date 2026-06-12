import pytest
import uuid
from app.core.security import hash_password
from app.models.forum_post import ForumPost

def test_forum_interactions(client, db):
    # 1. Create a User
    from app.models.user import User
    hashed = hash_password("ForumPass123")
    user = User(
        name="Forum Member",
        email="member@forumtest.com",
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
        "email": "member@forumtest.com",
        "password": "ForumPass123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Forum Post
    post_payload = {
        "title": "How to close deals fast?",
        "content": "Share your best tips and templates for followups.",
        "category": "Sales Strategy"
    }
    response = client.post("/forum/posts", json=post_payload, headers=headers)
    assert response.status_code == 201
    post_data = response.json()
    assert post_data["title"] == "How to close deals fast?"
    assert post_data["category"] == "Sales Strategy"
    post_id = post_data["id"]

    # 3. List Forum Posts
    list_response = client.get("/forum/posts", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["id"] == post_id

    # 4. Get Single Post (and increment views)
    get_response = client.get(f"/forum/posts/{post_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["views"] == 1

    # 5. Upvote Post
    upvote_response = client.post(f"/forum/posts/{post_id}/upvote", headers=headers)
    assert upvote_response.status_code == 200
    assert upvote_response.json()["upvotes"] == 1

    # 6. Reply to Post
    reply_payload = {
        "content": "Always send follow-up within 24 hours of call."
    }
    reply_response = client.post(f"/forum/posts/{post_id}/reply", json=reply_payload, headers=headers)
    assert reply_response.status_code == 201
    reply_data = reply_response.json()
    assert reply_data["content"] == "Always send follow-up within 24 hours of call."
    assert reply_data["post_id"] == post_id

    # Verify reply count incremented
    post_after_reply = client.get(f"/forum/posts/{post_id}", headers=headers)
    assert post_after_reply.status_code == 200
    assert post_after_reply.json()["reply_count"] == 1
    assert len(post_after_reply.json()["replies"]) == 1

    # 7. Edit Post
    edit_payload = {
        "title": "Best tips to close deals fast!",
        "content": "Updated content: Share your best strategies.",
        "category": "Sales Strategy"
    }
    patch_response = client.patch(f"/forum/posts/{post_id}", json=edit_payload, headers=headers)
    assert patch_response.status_code == 200
    assert patch_response.json()["title"] == "Best tips to close deals fast!"

    # 8. Delete Post
    delete_response = client.delete(f"/forum/posts/{post_id}", headers=headers)
    assert delete_response.status_code == 204
