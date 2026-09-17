import pytest
import uuid
from datetime import datetime, timezone
from app.core.database import SessionLocal
from app.models import (
    Foundation,
    Group,
    Member,
    Fund,
    Expense,
    MonthlyContribution,
    ContributionPayment,
    Loan,
    LoanRepayment,
    FundAllocation,
    Document,
    LedgerTransaction,
    LedgerEntry,
    MemberRequest,
    Role,
    User,
    AuditLog
)
from app.core.security import get_password_hash

def test_hard_delete_forbidden_for_non_superadmin(client, admin_token):
    """Test that a non-Super Admin user receives HTTP 403 Forbidden."""
    db = SessionLocal()
    try:
        # Create a non-superadmin role & user if not exists
        role = db.query(Role).filter(Role.name == "Employee").first()
        if not role:
            role = Role(name="Employee", description="Standard Staff")
            db.add(role)
            db.commit()
            db.refresh(role)

        test_user = db.query(User).filter(User.username == "test_employee").first()
        if not test_user:
            test_user = User(
                username="test_employee",
                name="Test Employee",
                email="employee@example.com",
                password=get_password_hash("password123"),
                roleId=role.id,
                status="ACTIVE"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        # Login as employee
        login_res = client.post("/api/v1/auth/login", json={
            "username": "test_employee",
            "password": "password123"
        })
        assert login_res.status_code == 200
        emp_token = login_res.json()["data"]["access_token"]

        # Attempt to delete a random group id
        del_res = client.delete(
            f"/api/v1/groups/{str(uuid.uuid4())}",
            headers={"Authorization": f"Bearer {emp_token}"}
        )
        assert del_res.status_code == 403, f"Expected 403, got {del_res.status_code}: {del_res.text}"
        assert del_res.json()["error"]["code"] == "FORBIDDEN"
    finally:
        db.close()


def test_hard_delete_group_with_full_dependency_graph(client, auth_headers):
    """
    Test hard delete of a Group that has:
    - Members
    - Funds
    - Ledger Transactions & Entries
    - Monthly Contributions & Contribution Payments
    - Loans & Loan Repayments & Fund Allocations
    - Expenses
    - Documents
    - Member Requests
    """
    db = SessionLocal()
    uid = uuid.uuid4().hex[:6]
    group_code = f"TEST-GRP-{uid}"
    
    try:
        foundation = db.query(Foundation).first()
        assert foundation is not None

        # 1. Create Group
        group = Group(
            foundationId=foundation.id,
            name=f"Test Group {uid}",
            code=group_code,
            status="ACTIVE",
            isFoundationGroup=False,
            memberSignupEnabled=True
        )
        db.add(group)
        db.flush()
        group_id = group.id

        # 2. Create Group Fund
        fund = Fund(
            groupId=group_id,
            name=f"Test Group Fund {uid}",
            description="Test group reserve fund"
        )
        db.add(fund)
        db.flush()
        fund_id = fund.id

        # General fund for balanced ledger entries
        gen_fund = db.query(Fund).filter(Fund.groupId.is_(None)).first()
        assert gen_fund is not None

        # 3. Create Member in this Group
        member = Member(
            memberId=f"TM-{uid}",
            groupId=group_id,
            fullName="Test Member",
            status="ACTIVE"
        )
        db.add(member)
        db.flush()
        member_id = member.id

        # 4. Create Member Document & Group Document
        doc1 = Document(
            documentNumber=f"DOC-G-{uid}",
            title="Group Constitution",
            type="DOCUMENT",
            cloudinaryPublicId=f"cl_g_{uid}",
            secureUrl="https://example.com/doc1.pdf",
            originalFilename="doc1.pdf",
            mimeType="application/pdf",
            sizeBytes=1024,
            targetType="GROUP",
            groupId=group_id
        )
        doc2 = Document(
            documentNumber=f"DOC-M-{uid}",
            title="Member Photo",
            type="IMAGE",
            cloudinaryPublicId=f"cl_m_{uid}",
            secureUrl="https://example.com/photo.jpg",
            originalFilename="photo.jpg",
            mimeType="image/jpeg",
            sizeBytes=2048,
            targetType="MEMBER",
            memberId=member_id
        )
        db.add_all([doc1, doc2])
        db.flush()


        # 5. Create Monthly Contribution & Contribution Payment & Ledger Transaction
        mc = MonthlyContribution(
            memberId=member_id,
            month=9,
            year=2026,
            expectedAmount=500,
            status="PAID"
        )
        db.add(mc)
        db.flush()

        tx1 = LedgerTransaction(
            date=datetime.now(timezone.utc),
            type="CONTRIBUTION",
            memberId=member_id,
            status="COMPLETED"
        )
        db.add(tx1)
        db.flush()

        le1_debit = LedgerEntry(
            transactionId=tx1.id,
            fundId=gen_fund.id,
            isCredit=False,
            amount=500,
            groupId=group_id
        )
        le1_credit = LedgerEntry(
            transactionId=tx1.id,
            fundId=fund_id,
            isCredit=True,
            amount=500,
            groupId=group_id
        )
        db.add_all([le1_debit, le1_credit])

        cp = ContributionPayment(
            monthlyContributionId=mc.id,
            ledgerTransactionId=tx1.id,
            amount=500,
            paymentDate=datetime.now(timezone.utc),
            paymentMethod="CASH"
        )
        db.add(cp)
        db.flush()

        # 6. Create Loan & Loan Repayment & Fund Allocation
        loan = Loan(
            loanNumber=f"LN-{uid}",
            memberId=member_id,
            amount=2000,
            purpose="Business Aid",
            status="ACTIVE"
        )
        db.add(loan)
        db.flush()

        fa = FundAllocation(
            fundId=fund_id,
            targetType="LOAN",
            loanId=loan.id,
            amount=2000
        )
        db.add(fa)
        db.flush()

        tx2 = LedgerTransaction(
            date=datetime.now(timezone.utc),
            type="REPAYMENT",
            memberId=member_id,
            status="COMPLETED"
        )
        db.add(tx2)
        db.flush()

        le2_debit = LedgerEntry(
            transactionId=tx2.id,
            fundId=gen_fund.id,
            isCredit=False,
            amount=500,
            groupId=group_id
        )
        le2_credit = LedgerEntry(
            transactionId=tx2.id,
            fundId=fund_id,
            isCredit=True,
            amount=500,
            groupId=group_id
        )
        db.add_all([le2_debit, le2_credit])

        lr = LoanRepayment(
            loanId=loan.id,
            ledgerTransactionId=tx2.id,
            amount=500,
            date=datetime.now(timezone.utc),
            status="COMPLETED"
        )
        db.add(lr)
        db.flush()

        # 7. Create Group Expense
        exp = Expense(
            groupId=group_id,
            amount=300,
            comment="Test Group Office Expense"
        )
        db.add(exp)
        db.flush()

        # 8. Create Member Request referencing this group
        mr = MemberRequest(
            applicationNumber=f"APP-{uid}",
            fullName="Prospective Member",
            groupId=group_id,
            status="PENDING"
        )
        db.add(mr)
        db.commit()

        # Verify all records are present in DB
        assert db.query(Group).filter(Group.id == group_id).count() == 1
        assert db.query(Fund).filter(Fund.groupId == group_id).count() == 1
        assert db.query(Member).filter(Member.groupId == group_id).count() == 1
        assert db.query(Expense).filter(Expense.groupId == group_id).count() == 1
        assert db.query(MonthlyContribution).filter(MonthlyContribution.memberId == member_id).count() == 1
        assert db.query(Loan).filter(Loan.memberId == member_id).count() == 1

        # Store scalar IDs before deleting
        cp_id = cp.id
        loan_id = loan.id
        lr_id = lr.id
        fa_id = fa.id
        tx1_id = tx1.id
        tx2_id = tx2.id
        mr_id = mr.id

        # -------------------------------------------------------------
        # Execute Hard Delete via Super Admin API
        # -------------------------------------------------------------
        del_res = client.delete(f"/api/v1/groups/{group_id}", headers=auth_headers)
        assert del_res.status_code == 200, f"Delete failed: {del_res.text}"
        res_data = del_res.json()
        assert res_data["success"] is True
        assert res_data["data"]["message"] == "Group deleted permanently."

        # Expire local test session cache to reflect committed changes from API request
        db.expire_all()

        # -------------------------------------------------------------
        # Verify in DB: Group and all child records are permanently removed
        # -------------------------------------------------------------
        assert db.query(Group).filter(Group.id == group_id).first() is None
        assert db.query(Fund).filter(Fund.id == fund_id).first() is None
        assert db.query(Member).filter(Member.id == member_id).first() is None
        assert db.query(Expense).filter(Expense.groupId == group_id).first() is None
        assert db.query(Document).filter(Document.groupId == group_id).first() is None
        assert db.query(Document).filter(Document.memberId == member_id).first() is None
        assert db.query(MonthlyContribution).filter(MonthlyContribution.memberId == member_id).first() is None
        assert db.query(ContributionPayment).filter(ContributionPayment.id == cp_id).first() is None
        assert db.query(Loan).filter(Loan.id == loan_id).first() is None
        assert db.query(LoanRepayment).filter(LoanRepayment.id == lr_id).first() is None
        assert db.query(FundAllocation).filter(FundAllocation.id == fa_id).first() is None
        assert db.query(LedgerTransaction).filter(LedgerTransaction.id.in_([tx1_id, tx2_id])).count() == 0
        assert db.query(LedgerEntry).filter(LedgerEntry.transactionId.in_([tx1_id, tx2_id])).count() == 0

        # Verify MemberRequest groupId is nullified
        db_mr = db.query(MemberRequest).filter(MemberRequest.id == mr_id).first()
        assert db_mr is not None
        assert db_mr.groupId is None

        # Verify AuditLog has record of deletion
        audit = db.query(AuditLog).filter(AuditLog.referenceId == group_id).first()
        assert audit is not None
        assert audit.action == "HARD_DELETE" or audit.action == "DELETE"

        print("Test hard delete completed successfully! All records cleanly deleted.")


    finally:
        db.close()
