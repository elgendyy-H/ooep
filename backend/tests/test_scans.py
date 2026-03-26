def test_create_scan(client):
    # First login to get token
    client.post("/auth/register", json={
        "email": "scanuser@example.com",
        "username": "scanuser",
        "full_name": "Scan User",
        "password": "StrongP@ssw0rd"
    })
    login_resp = client.post("/auth/login", json={
        "email": "scanuser@example.com",
        "password": "StrongP@ssw0rd"
    })
    token = login_resp.json()["access_token"]

    response = client.post(
        "/scans/",
        json={
            "target_url": "https://example.com",
            "scan_type": "full",
            "modules": ["A01", "A02"]
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target_url"] == "https://example.com"
    assert data["scan_type"] == "full"

def test_list_scans(client):
    # Login and create a scan first
    client.post("/auth/register", json={
        "email": "listuser@example.com",
        "username": "listuser",
        "full_name": "List User",
        "password": "StrongP@ssw0rd"
    })
    login_resp = client.post("/auth/login", json={
        "email": "listuser@example.com",
        "password": "StrongP@ssw0rd"
    })
    token = login_resp.json()["access_token"]

    client.post(
        "/scans/",
        json={"target_url": "https://example.com", "scan_type": "quick"},
        headers={"Authorization": f"Bearer {token}"}
    )

    response = client.get("/scans/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1