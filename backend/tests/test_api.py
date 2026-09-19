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

def test_sadaqah_grant_crud_flow(client, auth_headers):
    # Ensure a beneficiary exists
    res_b = client.get("/api/v1/beneficiaries", headers=auth_headers)
    beneficiaries = res_b.json().get("data", [])
    if not beneficiaries:
        res_cb = client.post("/api/v1/beneficiaries", json={
            "fullName": "Test Beneficiary",
            "phone": "01799998877",
            "address": "Dhaka",
            "category": "POOR_AND_NEEDY",
            "monthlyIncome": 2000
        }, headers=auth_headers)
        beneficiary_id = res_cb.json()["data"]["id"]
    else:
        beneficiary_id = beneficiaries[0]["id"]

    # Ensure a group exists
    res_g = client.get("/api/v1/groups", headers=auth_headers)
    group_id = res_g.json()["data"][0]["id"]

    # 1. Test POST /api/v1/grants (standard create)
    grant_payload = {
        "beneficiaryId": beneficiary_id,
        "amount": 2500,
        "grantReason": "Monthly Living Allowance",
        "grantDate": "2026-09-19T00:00:00.000Z",
        "comment": "Regular disbursement",
        "allocations": [{"groupId": group_id, "amount": 2500}]
    }
    res_create = client.post("/api/v1/grants", json=grant_payload, headers=auth_headers)
    assert res_create.status_code == 200
    created_grant = res_create.json()["data"]
    grant_id = created_grant["id"]
    assert created_grant["amount"] == 2500
    assert created_grant["purpose"] == "Monthly Living Allowance"

    # 2. Test GET /api/v1/grants/{id}
    res_get = client.get(f"/api/v1/grants/{grant_id}", headers=auth_headers)
    assert res_get.status_code == 200
    assert res_get.json()["data"]["id"] == grant_id

    # 3. Test GET /api/v1/grants list
    res_list = client.get("/api/v1/grants", headers=auth_headers)
    assert res_list.status_code == 200
    assert any(g["id"] == grant_id for g in res_list.json()["data"])

    # 4. Test POST /api/v1/grants/issue (alias)
    grant_payload_issue = {
        "beneficiaryId": beneficiary_id,
        "amount": 1500,
        "grantReason": "Issue Alias Test",
        "grantDate": "2026-09-19T00:00:00.000Z",
        "comment": "Testing issue alias",
        "allocations": [{"groupId": group_id, "amount": 1500}]
    }
    res_issue = client.post("/api/v1/grants/issue", json=grant_payload_issue, headers=auth_headers)
    assert res_issue.status_code == 200
    issue_grant_id = res_issue.json()["data"]["id"]

    # 5. Test POST /api/v1/sadaqah (sadaqah router alias)
    grant_payload_sadaqah = {
        "beneficiaryId": beneficiary_id,
        "amount": 1200,
        "grantReason": "Sadaqah Prefix Test",
        "grantDate": "2026-09-19T00:00:00.000Z",
        "comment": "Testing sadaqah prefix",
        "allocations": [{"groupId": group_id, "amount": 1200}]
    }
    res_sadaqah = client.post("/api/v1/sadaqah", json=grant_payload_sadaqah, headers=auth_headers)
    assert res_sadaqah.status_code == 200
    sadaqah_grant_id = res_sadaqah.json()["data"]["id"]

    # 6. Test DELETE /api/v1/grants/{id}
    res_del1 = client.delete(f"/api/v1/grants/{issue_grant_id}", headers=auth_headers)
    assert res_del1.status_code == 200
    res_del2 = client.delete(f"/api/v1/grants/{sadaqah_grant_id}", headers=auth_headers)
    assert res_del2.status_code == 200

def test_qard_hasan_loan_crud_flow(client, auth_headers):
    # Ensure a beneficiary exists
    res_b = client.get("/api/v1/beneficiaries", headers=auth_headers)
    beneficiaries = res_b.json().get("data", [])
    if not beneficiaries:
        res_cb = client.post("/api/v1/beneficiaries", json={
            "fullName": "Loan Beneficiary Test",
            "phone": "01788887766",
            "address": "Sylhet",
            "category": "POOR_AND_NEEDY",
            "monthlyIncome": 3000
        }, headers=auth_headers)
        beneficiary_id = res_cb.json()["data"]["id"]
    else:
        beneficiary_id = beneficiaries[0]["id"]

    # Ensure a group exists
    res_g = client.get("/api/v1/groups", headers=auth_headers)
    group_id = res_g.json()["data"][0]["id"]

    # 1. Create Qard Hasan via POST /api/v1/loans WITHOUT manual installmentAmount
    # amount=5000, totalInstallments=6 -> installmentAmount should be auto-derived to 5000 // 6 = 833
    loan_payload = {
        "beneficiaryId": beneficiary_id,
        "loanType": "EMERGENCY",
        "amount": 5000,
        "purpose": "Medical emergency support",
        "installmentType": "MONTHLY",
        "totalInstallments": 6,
        "fundAllocations": [{"groupId": group_id, "amount": 5000}]
    }
    res_create = client.post("/api/v1/loans", json=loan_payload, headers=auth_headers)
    assert res_create.status_code == 200
    created_loan = res_create.json()["data"]
    loan_id = created_loan["id"]
    assert created_loan["amount"] == 5000
    assert created_loan["installmentAmount"] == 833  # auto-derived integer division
    assert created_loan["remainingBalance"] == 5000

    # 2. Test GET /api/v1/loans/{id}
    res_get = client.get(f"/api/v1/loans/{loan_id}", headers=auth_headers)
    assert res_get.status_code == 200
    assert res_get.json()["data"]["id"] == loan_id

    # 3. Test POST /api/v1/loans/issue (alias used by frontend)
    loan_payload_issue = {
        "beneficiaryId": beneficiary_id,
        "loanType": "BUSINESS",
        "businessType": "Poultry",
        "amount": 10000,
        "purpose": "Feed and chicks",
        "installmentType": "MONTHLY",
        "totalInstallments": 10,
        "fundAllocations": [{"groupId": group_id, "amount": 10000}]
    }
    res_issue = client.post("/api/v1/loans/issue", json=loan_payload_issue, headers=auth_headers)
    assert res_issue.status_code == 200
    issue_loan = res_issue.json()["data"]
    assert issue_loan["installmentAmount"] == 1000
    issue_loan_id = issue_loan["id"]

    # 4. Test POST /api/v1/qard-hasan (prefix alias)
    loan_payload_prefix = {
        "beneficiaryId": beneficiary_id,
        "loanType": "EDUCATION",
        "amount": 3000,
        "purpose": "Semester Fee",
        "installmentType": "MONTHLY",
        "totalInstallments": 3,
        "fundAllocations": [{"groupId": group_id, "amount": 3000}]
    }
    res_prefix = client.post("/api/v1/qard-hasan", json=loan_payload_prefix, headers=auth_headers)
    assert res_prefix.status_code == 200
    prefix_loan_id = res_prefix.json()["data"]["id"]

    # 5. Test PUT and PATCH /api/v1/loans/{id}
    res_patch = client.patch(f"/api/v1/loans/{loan_id}", json={
        "notes": "Updated notes via PATCH"
    }, headers=auth_headers)
    assert res_patch.status_code == 200
    assert res_patch.json()["data"]["notes"] == "Updated notes via PATCH"

    # 6. Test Repayment POST /api/v1/loans/{id}/repay
    res_repay = client.post(f"/api/v1/loans/{loan_id}/repay", json={
        "loanId": loan_id,
        "amount": 833,
        "date": "2026-09-19T00:00:00.000Z",
        "paymentMethod": "CASH",
        "installmentNo": 1
    }, headers=auth_headers)
    assert res_repay.status_code == 200
    assert res_repay.json()["data"]["remainingBalance"] == 5000 - 833

    # 7. Clean up via DELETE /api/v1/loans/{id}
    res_del_issue = client.delete(f"/api/v1/loans/{issue_loan_id}", headers=auth_headers)
    assert res_del_issue.status_code == 200
    res_del_prefix = client.delete(f"/api/v1/loans/{prefix_loan_id}", headers=auth_headers)
    assert res_del_prefix.status_code == 200

