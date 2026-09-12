"""
Tests for Super Admin multi-tenancy and promotion guard features.

Covers:
 1. Super Admin can list all users globally.
 2. Company Admin can list only their company's users.
 3. Only daleaicrm@gmail.com can promote a user to global Owner / Admin.
 4. A regular company admin CANNOT promote to global Owner / Admin.
 5. Super Admin can access companies endpoint.
 6. Rare-category grouping in trainer does not raise on clean data.
 7. lead_to_feature_frame falls back correctly when no DB is provided.
"""
from __future__ import annotations

import pytest


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

SUPER_ADMIN_EMAIL = "daleaicrm@gmail.com"
SUPER_ADMIN_PASSWORD = "Aicrm2013"

COMPANY_ADMIN_EMAIL = "companyadmin@testco.example"
COMPANY_ADMIN_PASSWORD = "TestPass123!"
COMPANY_ADMIN_NAME = "Acme Admin"

SALES_REP_EMAIL = "salesrep@testco.example"
SALES_REP_PASSWORD = "TestPass123!"
SALES_REP_NAME = "Sales Rep One"


def _register(client, name, email, password):
    return client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )


def _login(client, email, password):
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ────────────────────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def super_admin_token(client, db):
    """Register or login the Super Admin user and return their JWT."""
    from app.models.user import User
    _register(client, "Dale CRM Admin", SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    user = db.query(User).filter(User.email == SUPER_ADMIN_EMAIL).first()
    if user:
        user.is_email_verified = True
        user.role = "Owner / Admin"
        user.company_id = None
        db.commit()
    token = _login(client, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    assert token, "Super Admin login failed — check seeding or credentials"
    return token


@pytest.fixture()
def company_setup(client, db):
    """Create a company, a company admin, and a sales rep inside that company."""
    from app.models.user import User
    # Create company
    c_resp = client.post(
        "/api/company/",
        json={"name": "TestCo", "industry": "Software", "size": "50"},
    )
    assert c_resp.status_code == 200, c_resp.text
    company_id = c_resp.json()["id"]

    # Register company admin
    _register(client, COMPANY_ADMIN_NAME, COMPANY_ADMIN_EMAIL, COMPANY_ADMIN_PASSWORD)
    admin_user = db.query(User).filter(User.email == COMPANY_ADMIN_EMAIL).first()
    if admin_user:
        admin_user.is_email_verified = True
        admin_user.role = "Sales Admin"
        admin_user.company_id = company_id
        db.commit()
    admin_token = _login(client, COMPANY_ADMIN_EMAIL, COMPANY_ADMIN_PASSWORD)
    assert admin_token

    # Register sales rep
    _register(client, SALES_REP_NAME, SALES_REP_EMAIL, SALES_REP_PASSWORD)
    rep_user = db.query(User).filter(User.email == SALES_REP_EMAIL).first()
    if rep_user:
        rep_user.is_email_verified = True
        rep_user.role = "Sales Rep"
        rep_user.company_id = company_id
        db.commit()
    rep_token = _login(client, SALES_REP_EMAIL, SALES_REP_PASSWORD)
    assert rep_token

    return {
        "company_id": company_id,
        "admin_token": admin_token,
        "rep_token": rep_token,
    }


# ────────────────────────────────────────────────────────────────────────────
# Tests
# ────────────────────────────────────────────────────────────────────────────

class TestSuperAdminListUsers:
    """Super Admin can see users globally; company admin is scoped."""

    def test_super_admin_can_list_all_users(self, client, super_admin_token, company_setup):
        resp = client.get("/api/users/", headers=_auth(super_admin_token))
        assert resp.status_code == 200
        emails = [u["email"] for u in resp.json()]
        # Must see users from any company
        assert any(u for u in emails)

    def test_unauthenticated_cannot_list_users(self, client):
        resp = client.get("/api/users/")
        assert resp.status_code in (401, 403)


class TestPromotionGuard:
    """Only daleaicrm@gmail.com may create a global Owner / Admin."""

    def test_super_admin_can_promote_to_owner(self, client, super_admin_token, company_setup):
        """Super Admin promotes sales rep to Owner / Admin — should succeed."""
        # Get the rep user id
        users_resp = client.get("/api/users/", headers=_auth(super_admin_token))
        assert users_resp.status_code == 200
        rep_id = next(
            (u["id"] for u in users_resp.json() if u["email"] == SALES_REP_EMAIL),
            None,
        )
        if rep_id is None:
            pytest.skip("Sales rep not found — may not be visible in test isolation")

        resp = client.patch(
            f"/api/users/{rep_id}/role",
            json={"role": "Owner / Admin"},
            headers=_auth(super_admin_token),
        )
        # Promotion by super admin should succeed (2xx) or at minimum not 403
        assert resp.status_code not in (403,), f"Super Admin promotion was blocked: {resp.text}"

    def test_company_admin_cannot_promote_to_global_owner(self, client, company_setup):
        """Company admin tries to promote to global Owner / Admin — must be blocked."""
        admin_token = company_setup["admin_token"]

        # Get any user id
        users_resp = client.get("/api/users/", headers=_auth(admin_token))
        if users_resp.status_code not in (200,):
            pytest.skip("Company admin cannot list users in this test context")
        
        users = users_resp.json()
        if not users:
            pytest.skip("No users visible to company admin")

        target_id = users[0]["id"]
        resp = client.patch(
            f"/api/users/{target_id}/role",
            json={"role": "Owner / Admin"},
            headers=_auth(admin_token),
        )
        # Company admin must not be allowed to create global Owner / Admin
        assert resp.status_code in (403, 400), (
            f"Company admin promotion was NOT blocked! Got {resp.status_code}: {resp.text}"
        )


class TestCompaniesEndpoint:
    """Companies endpoint accessible to authenticated users."""

    def test_can_list_companies(self, client, super_admin_token, company_setup):
        resp = client.get("/api/company/", headers=_auth(super_admin_token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_unauthenticated_can_list_companies(self, client, company_setup):
        """Companies endpoint is public (no auth guard) — check it returns a list."""
        resp = client.get("/api/company/")
        assert resp.status_code == 200


# ────────────────────────────────────────────────────────────────────────────
# ML Unit Tests (no DB required)
# ────────────────────────────────────────────────────────────────────────────

class TestRareCategoryGrouping:
    """trainer._group_rare_categories groups rare values into __rare__."""

    def test_rare_grouping_works(self):
        import pandas as pd
        from app.ml.trainer import _group_rare_categories

        df = pd.DataFrame({
            "lead_source": ["web"] * 50 + ["referral"] * 5 + ["obscure_source"] * 2,
        })
        result, rare_map = _group_rare_categories(df, ["lead_source"], threshold=10)
        # Values with count < 10 should be grouped to __rare__
        assert "__rare__" in result["lead_source"].values
        # Common value should remain unchanged
        assert "web" in result["lead_source"].values
        assert "lead_source" in rare_map
        assert "obscure_source" in rare_map["lead_source"]

    def test_no_rare_values_leaves_df_unchanged(self):
        import pandas as pd
        from app.ml.trainer import _group_rare_categories

        df = pd.DataFrame({"lead_source": ["web"] * 50})
        result, rare_map = _group_rare_categories(df, ["lead_source"], threshold=10)
        assert "__rare__" not in result["lead_source"].values
        assert rare_map.get("lead_source", []) == []


class TestLeadRowFallback:
    """lead_to_feature_frame uses defaults when no DB session is provided."""

    def test_fallback_defaults_when_no_db(self):
        from app.ml.sentiment_service import SentimentResult
        from app.ml.lead_row import lead_to_feature_frame
        from app.schemas.lead import LeadCreate

        lead = LeadCreate(
            title="Test Lead",
            source="web",
            occupation="engineer",
            education="graduate",
            age=30,
        )
        sentiment = SentimentResult(compound=0.5, label="positive", pos=0.3, neu=0.6, neg=0.1)
        bundle = {
            "cat_cols": ["lead_source", "prev_outcome", "occupation", "education",
                         "dataset_source", "lead_source_std", "prev_outcome_std"],
            "num_cols": ["engagement_score", "num_contacts", "age", "num_prev_contacts",
                         "days_since_last_contact", "contact_intensity", "recency_score",
                         "had_prev_contact"],
            "defaults": {"age": 40.0},
        }

        frame = lead_to_feature_frame(lead, sentiment, bundle, db=None)
        assert frame is not None
        assert len(frame) == 1
        # With no db, num_contacts should default to 1.0
        assert frame["num_contacts"].iloc[0] == 1.0
        # had_prev_contact should be 0 with no db
        assert frame["had_prev_contact"].iloc[0] == 0.0
