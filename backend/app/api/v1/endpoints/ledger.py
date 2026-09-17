from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.ledger import LedgerRowItem
from app.models import Member, Donor, ContributionPayment, MonthlyContribution, LoanRepayment, Loan, Grant, LedgerTransaction, LedgerEntry
from app.dependencies.permissions import require_permission
from app.core.exceptions import NotFoundException

router = APIRouter()

@router.get("/member/{member_id}", response_model=APIResponse[List[LedgerRowItem]])
def get_member_ledger(
    member_id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Reports", "View"))
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise NotFoundException("Member not found.")

    rows: List[LedgerRowItem] = []

    # 1. Contributions (Deposit)
    contributions = (
        db.query(ContributionPayment)
        .join(MonthlyContribution, ContributionPayment.monthlyContributionId == MonthlyContribution.id)
        .filter(MonthlyContribution.memberId == member_id)
        .all()
    )
    for c in contributions:
        tx = c.ledgerTransaction
        if tx:
            rows.append(LedgerRowItem(
                id=tx.id,
                date=tx.date,
                reference=tx.referenceId or c.referenceNumber or "-",
                description=f"মাসিক চাঁদা - {c.monthlyContribution.month}/{c.monthlyContribution.year}",
                deposit=c.amount,
                withdrawal=0,
                type="CONTRIBUTION"
            ))

    # 2. Loan Repayments (Deposit)
    repayments = (
        db.query(LoanRepayment)
        .join(Loan, LoanRepayment.loanId == Loan.id)
        .filter(Loan.memberId == member_id)
        .all()
    )
    for r in repayments:
        tx = r.ledgerTransaction
        if tx:
            rows.append(LedgerRowItem(
                id=tx.id,
                date=tx.date,
                reference=tx.referenceId or "-",
                description=f"ঋণ পরিশোধ - {r.loan.loanNumber}",
                deposit=r.amount,
                withdrawal=0,
                type="LOAN_REPAYMENT"
            ))

    # 3. Loan Disbursements (Withdrawal)
    loans = db.query(Loan).filter(Loan.memberId == member_id, Loan.status.in_(["ACTIVE", "COMPLETED", "DEFAULTED"])).all()
    loan_numbers = [l.loanNumber for l in loans]
    if loan_numbers:
        loan_txs = db.query(LedgerTransaction).filter(LedgerTransaction.type == "LOAN", LedgerTransaction.referenceId.in_(loan_numbers)).all()
        for tx in loan_txs:
            amt = sum(e.amount for e in tx.entries if e.isCredit) or 0
            rows.append(LedgerRowItem(
                id=tx.id,
                date=tx.date,
                reference=tx.referenceId or "-",
                description=f"ঋণ বিতরণ - {tx.referenceId}",
                deposit=0,
                withdrawal=amt,
                type="LOAN"
            ))

    # 4. Grants (Withdrawal)
    beneficiary_ids = [b.id for b in member.beneficiaries]
    if beneficiary_ids:
        grants = db.query(Grant).filter(Grant.beneficiaryId.in_(beneficiary_ids)).all()
        grant_numbers = [g.grantNumber for g in grants]
        if grant_numbers:
            grant_txs = db.query(LedgerTransaction).filter(LedgerTransaction.type == "GRANT", LedgerTransaction.referenceId.in_(grant_numbers)).all()
            for tx in grant_txs:
                amt = sum(e.amount for e in tx.entries if e.isCredit) or 0
                rows.append(LedgerRowItem(
                    id=tx.id,
                    date=tx.date,
                    reference=tx.referenceId or "-",
                    description=f"অনুদান প্রদান - {tx.referenceId}",
                    deposit=0,
                    withdrawal=amt,
                    type="GRANT"
                ))

    # Sort descending by date
    rows.sort(key=lambda r: r.date, reverse=True)
    return APIResponse(success=True, data=rows)

@router.get("/donor/{donor_id}", response_model=APIResponse[List[LedgerRowItem]])
def get_donor_ledger(
    donor_id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Reports", "View"))
):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise NotFoundException("Donor not found.")

    txs = db.query(LedgerTransaction).filter(LedgerTransaction.donorId == donor_id).order_by(LedgerTransaction.date.desc()).all()
    rows = []
    for tx in txs:
        amt = sum(e.amount for e in tx.entries if e.isCredit) or 0
        rows.append(LedgerRowItem(
            id=tx.id,
            date=tx.date,
            reference=tx.referenceId or "-",
            description=tx.notes or "Donation",
            deposit=amt,
            withdrawal=0,
            type=tx.type
        ))

    return APIResponse(success=True, data=rows)

@router.get("/transactions", response_model=APIResponse[List[dict]])
def get_transactions(
    type: Optional[str] = Query(None, alias="type"),
    referenceId: Optional[str] = Query(None),
    fromDate: Optional[str] = Query(None),
    toDate: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Reports", "View"))
):
    query = db.query(LedgerTransaction)
    if type:
        if "," in type:
            types = [t.strip() for t in type.split(",")]
            query = query.filter(LedgerTransaction.type.in_(types))
        else:
            query = query.filter(LedgerTransaction.type == type)
    if referenceId:
        query = query.filter(LedgerTransaction.referenceId == referenceId)
    if fromDate:
        query = query.filter(LedgerTransaction.date >= fromDate)
    if toDate:
        query = query.filter(LedgerTransaction.date <= toDate)

    txs = query.order_by(LedgerTransaction.date.asc()).all()
    results = []
    for t in txs:
        results.append({
            "id": t.id,
            "date": t.date.isoformat(),
            "type": t.type,
            "referenceId": t.referenceId,
            "memberId": t.memberId,
            "donorId": t.donorId,
            "status": t.status,
            "notes": t.notes,
            "entries": [
                {
                    "id": e.id,
                    "fundId": e.fundId,
                    "isCredit": e.isCredit,
                    "amount": e.amount,
                    "groupId": e.groupId,
                    "groupCode": e.groupCode,
                    "groupName": e.groupName,
                    "fund": {
                        "id": e.fund.id,
                        "name": e.fund.name,
                        "groupId": e.fund.groupId,
                        "group": {
                            "id": e.fund.group.id,
                            "name": e.fund.group.name
                        } if (e.fund and e.fund.group) else None
                    } if e.fund else None
                }
                for e in t.entries
            ]
        })
    return APIResponse(success=True, data=results)
