def test_register(client):
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "StrongP@ssw0rd"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"

def test_login(client):
    # First register a user
    client.post("/auth/register", json={
        "email": "login@example.com",
        "username": "loginuser",
        "full_name": "Login User",
        "password": "StrongP@ssw0rd"
    })
    response = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "StrongP@ssw0rd"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"