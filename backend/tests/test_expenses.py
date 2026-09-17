import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import Group, Foundation, Fund
from app.services.ledger_engine import LedgerEngine
from app.schemas.ledger import LedgerEntryInput

def test_unauthorized_expenses_access():
    with TestClient(app) as clean_client:
        res = clean_client.get("/api/v1/expenses")
        assert res.status_code == 401

        res = clean_client.get("/api/v1/expense-names")
        assert res.status_code == 401

def test_expense_names_crud(client, auth_headers):
    # 1. List names
    res = client.get("/api/v1/expense-names", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 2. Create a new unique name
    unique_name = f"Test Category {uuid.uuid4().hex[:6]}"
    res = client.post("/api/v1/expense-names", headers=auth_headers, json={
        "name": unique_name
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    name_id = data["data"]["id"]
    assert data["data"]["name"] == unique_name
    assert data["data"]["isActive"] is True

    # 3. Duplicate creation rejection (case-insensitive)
    res_dup = client.post("/api/v1/expense-names", headers=auth_headers, json={
        "name": unique_name.lower()
    })
    assert res_dup.status_code == 400
    assert res_dup.json()["error"]["code"] == "DUPLICATE_EXPENSE_NAME"

    # 4. Empty name rejection
    res_empty = client.post("/api/v1/expense-names", headers=auth_headers, json={
        "name": "   "
    })
    assert res_empty.status_code in [400, 422]

    # 5. Update name
    res_up = client.patch(f"/api/v1/expense-names/{name_id}", headers=auth_headers, json={
        "isActive": False
    })
    assert res_up.status_code == 200
    assert res_up.json()["data"]["isActive"] is False

def test_create_expense_validation(client, auth_headers):
    # Missing groupId rejection
    res = client.post("/api/v1/expenses", headers=auth_headers, json={
        "customName": "Missing Group Test",
        "amount": 500,
        "expenseDate": "2026-09-16"
    })
    assert res.status_code in [400, 422]

    # Zero amount rejection
    res = client.post("/api/v1/expenses", headers=auth_headers, json={
        "groupId": "dummy-group-id",
        "customName": "Zero Amount Test",
        "amount": 0,
        "expenseDate": "2026-09-16"
    })
    assert res.status_code in [400, 422]

    # Negative amount rejection
    res = client.post("/api/v1/expenses", headers=auth_headers, json={
        "groupId": "dummy-group-id",
        "customName": "Negative Amount Test",
        "amount": -500,
        "expenseDate": "2026-09-16"
    })
    assert res.status_code in [400, 422]

    # Missing both expenseNameId and customName rejection
    res = client.post("/api/v1/expenses", headers=auth_headers, json={
        "groupId": "dummy-group-id",
        "amount": 1000,
        "expenseDate": "2026-09-16"
    })
    assert res.status_code in [400, 422]

def test_group_expense_financial_flow(client, auth_headers):
    # Setup test group with known balance in DB
    db = SessionLocal()
    foundation = db.query(Foundation).first()
    if not foundation:
        foundation = Foundation(name="Default Foundation")
        db.add(foundation)
        db.flush()

    group_name = f"Expense Test Group {uuid.uuid4().hex[:6]}"
    group_code = f"EXP-{uuid.uuid4().hex[:4].upper()}"
    group = Group(foundationId=foundation.id, name=group_name, code=group_code, status="ACTIVE")
    db.add(group)
    db.commit()
    group_id = str(group.id)

    # Fund the group with ৳10,000 using double-entry donation/contribution
    group_fund, general_fund = LedgerEngine.get_or_create_funds(db, group_id)
    from datetime import datetime, timezone
    seed_dt = datetime(2026, 9, 1, 0, 0, tzinfo=timezone.utc)
    LedgerEngine.create_transaction(
        db=db,
        date=seed_dt,
        type="CONTRIBUTION",
        entries=[
            LedgerEntryInput(fundId=group_fund.id, isCredit=True, amount=10000),
            LedgerEntryInput(fundId=general_fund.id, isCredit=False, amount=10000)
        ],
        notes="Seed test fund"
    )
    db.commit()
    db.close()

    # 1. Check group balance endpoint
    res_bal = client.get(f"/api/v1/groups/{group_id}/balance", headers=auth_headers)
    assert res_bal.status_code == 200
    assert res_bal.json()["data"]["currentBalance"] == 10000.0

    # 2. Test Insufficient Funds rejection (trying to spend ৳15,000 when only ৳10,000 available)
    res_reject = client.post("/api/v1/expenses", headers=auth_headers, json={
        "groupId": group_id,
        "customName": "Overbudget Generator",
        "amount": 15000,
        "expenseDate": "2026-09-16"
    })
    assert res_reject.status_code == 400
    assert res_reject.json()["error"]["code"] == "INSUFFICIENT_FUNDS"

    # Verify balance did NOT change
    res_bal_check = client.get(f"/api/v1/groups/{group_id}/balance", headers=auth_headers)
    assert res_bal_check.json()["data"]["currentBalance"] == 10000.0

    # 3. Create normal valid expense of ৳3,000
    res_exp1 = client.post("/api/v1/expenses", headers=auth_headers, json={
        "groupId": group_id,
        "customName": "Office Stationery",
        "amount": 3000,
        "comment": "Files and paper",
        "expenseDate": "2026-09-16"
    })
    assert res_exp1.status_code == 200
    exp1_data = res_exp1.json()["data"]
    exp1_id = exp1_data["id"]
    assert exp1_data["groupId"] == group_id
    assert exp1_data["groupName"] == group_name
    assert float(exp1_data["amount"]) == 3000.0

    # Verify group balance reduced by ৳3,000 (10,000 - 3,000 = 7,000)
    res_bal_after1 = client.get(f"/api/v1/groups/{group_id}/balance", headers=auth_headers)
    assert res_bal_after1.json()["data"]["currentBalance"] == 7000.0

    # 4. Verify Manage Expense, Report and Ledger include the group
    res_list = client.get(f"/api/v1/expenses?group_id={group_id}", headers=auth_headers)
    assert res_list.status_code == 200
    assert res_list.json()["data"]["total"] == 1
    assert res_list.json()["data"]["items"][0]["groupName"] == group_name

    res_rep = client.get(f"/api/v1/expenses/report?group_id={group_id}", headers=auth_headers)
    assert res_rep.status_code == 200
    assert float(res_rep.json()["data"]["totalAmount"]) == 3000.0
    assert any(g["groupId"] == group_id for g in res_rep.json()["data"]["groupBreakdown"])

    res_led = client.get(f"/api/v1/expenses/ledger?group_id={group_id}", headers=auth_headers)
    assert res_led.status_code == 200
    assert res_led.json()["data"]["items"][0]["groupName"] == group_name

    # 5. Test Edit Expense: update amount from ৳3,000 to ৳5,000
    res_up = client.patch(f"/api/v1/expenses/{exp1_id}", headers=auth_headers, json={
        "amount": 5000
    })
    assert res_up.status_code == 200
    assert float(res_up.json()["data"]["amount"]) == 5000.0

    # Verify group balance adjusted accordingly (10,000 - 5,000 = 5,000)
    res_bal_after_up = client.get(f"/api/v1/groups/{group_id}/balance", headers=auth_headers)
    assert res_bal_after_up.json()["data"]["currentBalance"] == 5000.0

    # 6. Test Soft-Delete Expense: deletes ledger transaction, restoring the ৳5,000 back to the group
    res_del = client.delete(f"/api/v1/expenses/{exp1_id}", headers=auth_headers)
    assert res_del.status_code == 200

    # Verify group balance is restored back to ৳10,000
    res_bal_after_del = client.get(f"/api/v1/groups/{group_id}/balance", headers=auth_headers)
    assert res_bal_after_del.json()["data"]["currentBalance"] == 10000.0

def test_expense_report_date_wise_filtering(client, auth_headers):
    # Setup test group with fund
    db = SessionLocal()
    foundation = db.query(Foundation).first()
    if not foundation:
        foundation = Foundation(name="Default Foundation")
        db.add(foundation)
        db.flush()

    group = Group(
        foundationId=foundation.id,
        name=f"Report Test Group {uuid.uuid4().hex[:6]}",
        code=f"RPT-{uuid.uuid4().hex[:4].upper()}",
        status="ACTIVE"
    )
    db.add(group)
    db.flush()

    group_fund, general_fund = LedgerEngine.get_or_create_funds(db, group.id)
    from datetime import datetime, timezone
    seed_dt = datetime(2026, 9, 1, 0, 0, tzinfo=timezone.utc)
    LedgerEngine.create_transaction(
        db=db,
        date=seed_dt,
        type="CONTRIBUTION",
        entries=[
            LedgerEntryInput(fundId=group_fund.id, isCredit=True, amount=15000),
            LedgerEntryInput(fundId=general_fund.id, isCredit=False, amount=15000)
        ],
        notes="Seed test fund for report"
    )
    db.commit()
    group_id = str(group.id)
    db.close()

    # Record 2 expenses on different dates
    res1 = client.post("/api/v1/expenses", headers=auth_headers, json={
        "groupId": group_id,
        "customName": "Early September Expense",
        "amount": 1200,
        "comment": "Early month office supply",
        "expenseDate": "2026-09-05T10:00:00Z"
    })
    assert res1.status_code == 200
    exp1_id = res1.json()["data"]["id"]

    res2 = client.post("/api/v1/expenses", headers=auth_headers, json={
        "groupId": group_id,
        "customName": "Mid September Expense",
        "amount": 2500,
        "comment": "Mid month utility payment",
        "expenseDate": "2026-09-15T14:30:00Z"
    })
    assert res2.status_code == 200
    exp2_id = res2.json()["data"]["id"]

    # 1. Query full report for this group
    res_all = client.get(f"/api/v1/expenses/report?group_id={group_id}", headers=auth_headers)
    assert res_all.status_code == 200
    data_all = res_all.json()["data"]
    assert data_all["totalCount"] == 2
    assert float(data_all["totalAmount"]) == 3700.0
    assert len(data_all["items"]) == 2
    # Verify newest first: 15 Sep before 05 Sep
    assert data_all["items"][0]["id"] == exp2_id
    assert data_all["items"][1]["id"] == exp1_id

    # 2. Query with date filter selecting only the 2nd expense (from_date=2026-09-10)
    res_filtered = client.get(
        f"/api/v1/expenses/report?group_id={group_id}&from_date=2026-09-10&to_date=2026-09-20",
        headers=auth_headers
    )
    assert res_filtered.status_code == 200
    data_filtered = res_filtered.json()["data"]
    assert data_filtered["totalCount"] == 1
    assert float(data_filtered["totalAmount"]) == 2500.0
    assert len(data_filtered["items"]) == 1
    assert data_filtered["items"][0]["id"] == exp2_id
    assert data_filtered["items"][0]["resolvedExpenseName"] == "Mid September Expense"

    # Cleanup
    client.delete(f"/api/v1/expenses/{exp1_id}", headers=auth_headers)
    client.delete(f"/api/v1/expenses/{exp2_id}", headers=auth_headers)

