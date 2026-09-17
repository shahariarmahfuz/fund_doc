from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.ledger import GeneralLedgerItem, FoundationSummaryItem
from app.models import Fund, LedgerTransaction, LedgerEntry, Member, Group
from app.dependencies.permissions import require_permission

router = APIRouter()

@router.get("/foundation-summary", response_model=APIResponse[List[FoundationSummaryItem]])
def get_foundation_summary_report(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Reports", "View"))
):
    funds = db.query(Fund).all()
    results = []

    for f in funds:
        balance = 0.0
        for entry in f.ledgerLines:
            if not f.groupId:
                # Cash asset: debit increases, credit decreases
                if not entry.isCredit:
                    balance += entry.amount
                else:
                    balance -= entry.amount
            else:
                # Group equity: credit increases, debit decreases
                if entry.isCredit:
                    balance += entry.amount
                else:
                    balance -= entry.amount

        results.append(FoundationSummaryItem(
            id=f.id,
            fundName=f.name,
            groupName=f.group.name if f.group else "Foundation (General)",
            type="Equity" if f.groupId else "Asset",
            balance=balance
        ))

    return APIResponse(success=True, data=results)

@router.get("/general-ledger", response_model=APIResponse[List[GeneralLedgerItem]])
def get_general_ledger_report(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Reports", "View"))
):
    entries = (
        db.query(LedgerTransaction)
        .order_by(LedgerTransaction.date.desc())
        .limit(1000)
        .all()
    )

    report_data = []
    for tx in entries:
        for e in tx.entries:
            report_data.append(GeneralLedgerItem(
                id=e.id,
                date=tx.date,
                type=tx.type,
                referenceId=tx.referenceId,
                fund=e.fund.name if e.fund else "General",
                group=e.groupName or "Foundation",
                debit=e.amount if not e.isCredit else 0,
                credit=e.amount if e.isCredit else 0,
                notes=tx.notes
            ))

    return APIResponse(success=True, data=report_data)

@router.get("/member-directory", response_model=APIResponse[List[dict]])
def get_member_directory_report(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Reports", "View"))
):
    members = db.query(Member).order_by(Member.memberId.asc()).all()
    data = []
    for m in members:
        data.append({
            "memberId": m.memberId,
            "name": m.fullName or "নাম পাওয়া যায়নি",
            "group": m.group.name if m.group else "No Group",
            "mobile": m.mobile,
            "email": m.email or "N/A",
            "status": m.status,
            "joinDate": m.joinDate.strftime("%Y-%m-%d") if m.joinDate else None
        })
    return APIResponse(success=True, data=data)
