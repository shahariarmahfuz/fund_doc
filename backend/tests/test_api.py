def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_branding_public(client):
    res = client.get("/api/v1/settings/branding")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "foundationName" in data["data"]

def test_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["username"] == "admin"
    assert "*" in data["data"]["user"]["permissions"]

def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"

def test_get_me(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["username"] == "admin"

def test_get_groups(client, auth_headers):
    res = client.get("/api/v1/groups", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1

def test_get_members(client, auth_headers):
    res = client.get("/api/v1/members", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)

def test_get_dashboard_stats(client, auth_headers):
    res = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "totalMembers" in data["data"]
    assert "currentCashBalance" in data["data"]
