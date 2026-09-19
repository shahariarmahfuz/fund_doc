from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.contribution import (
    ContributionCreate,
    MonthlyContributionResponse,
    ContributionPaymentResponse
)
from app.schemas.ledger import LedgerEntryInput
from app.models import Member, MonthlyContribution, ContributionPayment, LedgerTransaction, LedgerEntry
from app.services.ledger_engine import LedgerEngine
from app.services.member_service import MemberService
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

@router.get("", response_model=APIResponse[List[MonthlyContributionResponse]])
def get_contributions(
    memberId: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Fund Collection", "View"))
):
    query = (
        db.query(MonthlyContribution)
        .options(
            joinedload(MonthlyContribution.member).joinedload(Member.group),
            joinedload(MonthlyContribution.payments)
        )
    )
    if memberId:
        query = query.filter(MonthlyContribution.memberId == memberId)
    if month:
        query = query.filter(MonthlyContribution.month == month)
    if year:
        query = query.filter(MonthlyContribution.year == year)
    if status:
        query = query.filter(MonthlyContribution.status == status)

    contributions = query.order_by(MonthlyContribution.year.desc(), MonthlyContribution.month.desc()).all()
    return APIResponse(success=True, data=contributions)

@router.post("", response_model=APIResponse[dict])
def create_contribution(
    payload: ContributionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Fund Collection", "Add"))
):
    member = db.query(Member).filter(Member.id == payload.memberId).first()
    if not member:
        raise NotFoundException("Member not found.")

    # 1. Find or create MonthlyContribution
    monthly_contrib = None
    if not payload.isAdditional:
        existing = (
            db.query(MonthlyContribution)
            .filter(
                MonthlyContribution.memberId == payload.memberId,
                MonthlyContribution.month == payload.month,
                MonthlyContribution.year == payload.year,
                MonthlyContribution.isAdditional.is_(False)
            )
            .first()
        )
        if existing:
            if existing.status == "PAID":
                raise APIException(
                    "এই চাঁদাটি ইতিমধ্যেই সম্পূর্ণ পরিশোধিত। অতিরিক্ত চাঁদার জন্য 'অতিরিক্ত চাঁদা' ব্যবহার করুন।",
                    code="ALREADY_PAID"
                )
            existing.status = payload.status
            monthly_contrib = existing

    if not monthly_contrib:
        monthly_contrib = MonthlyContribution(
            memberId=payload.memberId,
            month=payload.month,
            year=payload.year,
            expectedAmount=payload.amount,
            isAdditional=payload.isAdditional,
            status=payload.status,
            createdBy=current_user.id
        )
        db.add(monthly_contrib)
        db.flush()

    # 2. Get or create Funds
    group_fund, general_fund = LedgerEngine.get_or_create_funds(db, member.groupId)

    # 3. Balanced Ledger Entries
    # Debit General Fund (Asset Cash increases)
    # Credit Group Fund (Equity increases)
    payment_dt = datetime.fromisoformat(payload.paymentDate.replace("Z", "+00:00"))

    entries = [
        LedgerEntryInput(fundId=general_fund.id, isCredit=False, amount=payload.amount),
        LedgerEntryInput(fundId=group_fund.id, isCredit=True, amount=payload.amount)
    ]

    ref_id = f"VOUCHER-{payload.month:02d}-{payload.year}"
    ledger_tx = LedgerEngine.create_transaction(
        db=db,
        date=payment_dt,
        type="CONTRIBUTION",
        entries=entries,
        reference_id=ref_id,
        member_id=member.id,
        notes=payload.notes or f"মাসিক চাঁদা - {payload.month}/{payload.year}",
        created_by=current_user.id
    )

    # 4. Create ContributionPayment
    payment = ContributionPayment(
        monthlyContributionId=monthly_contrib.id,
        ledgerTransactionId=ledger_tx.id,
        amount=payload.amount,
        paymentDate=payment_dt,
        paymentMethod=payload.paymentMethod,
        referenceNumber=payload.referenceNumber,
        notes=payload.notes,
        createdBy=current_user.id
    )
    db.add(payment)
    db.flush()

    # 5. Recalculate member's paidUntilMonth and paidUntilYear
    MemberService.update_member_paid_until(db, member.id)

    db.commit()
    return APIResponse(success=True, data={
        "message": "Contribution recorded successfully.",
        "monthlyContributionId": monthly_contrib.id,
        "paymentId": payment.id,
        "transactionId": ledger_tx.id
    })

@router.get("/ledger/{member_id}", response_model=APIResponse[List[dict]])
def get_member_contributions(
    member_id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Fund Collection", "View"))
):
    payments = (
        db.query(ContributionPayment)
        .join(MonthlyContribution, ContributionPayment.monthlyContributionId == MonthlyContribution.id)
        .filter(MonthlyContribution.memberId == member_id)
        .order_by(ContributionPayment.paymentDate.desc())
        .all()
    )

    result = []
    for p in payments:
        result.append({
            "id": p.id,
            "month": p.monthlyContribution.month,
            "year": p.monthlyContribution.year,
            "amount": p.amount,
            "paymentDate": p.paymentDate.strftime("%Y-%m-%d"),
            "paymentMethod": p.paymentMethod,
            "referenceNumber": p.referenceNumber,
            "notes": p.notes,
            "isAdditional": p.monthlyContribution.isAdditional,
            "status": p.monthlyContribution.status
        })

    return APIResponse(success=True, data=result)

@router.delete("/{id}", response_model=APIResponse[dict])
@router.delete("/payment/{id}", response_model=APIResponse[dict], include_in_schema=False)
def delete_contribution(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Fund Collection", "Delete"))
):
    # Support deletion by monthlyContribution.id or contributionPayment.id
    mc = db.query(MonthlyContribution).filter(MonthlyContribution.id == id).first()
    if not mc:
        payment_match = db.query(ContributionPayment).filter(ContributionPayment.id == id).first()
        if payment_match:
            mc = db.query(MonthlyContribution).filter(MonthlyContribution.id == payment_match.monthlyContributionId).first()

    if not mc:
        raise NotFoundException("Monthly contribution not found.")

    member_id = mc.memberId
    payments = db.query(ContributionPayment).filter(ContributionPayment.monthlyContributionId == mc.id).all()

    tx_ids_to_delete = []
    for payment in payments:
        if payment.ledgerTransactionId:
            tx_ids_to_delete.append(payment.ledgerTransactionId)
        db.delete(payment)

    # Flush payment deletes first so RESTRICT foreign key on LedgerTransaction is cleared
    db.flush()

    for tx_id in tx_ids_to_delete:
        db.query(LedgerEntry).filter(LedgerEntry.transactionId == tx_id).delete(synchronize_session=False)
        db.query(LedgerTransaction).filter(LedgerTransaction.id == tx_id).delete(synchronize_session=False)

    db.delete(mc)
    db.flush()

    MemberService.update_member_paid_until(db, member_id)
    db.commit()
    return APIResponse(success=True, data={"message": "Contribution deleted successfully."})

@router.post("/refund", response_model=APIResponse[dict])
def create_contribution_refund(
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Fund Collection", "Add"))
):
    member = db.query(Member).filter(Member.id == payload["memberId"]).first()
    if not member:
        raise NotFoundException("Member not found.")

    p_date = datetime.fromisoformat(payload["paymentDate"].replace("Z", "+00:00"))
    group_fund, general_fund = LedgerEngine.get_or_create_funds(db, member.groupId)

    ref_no = payload.get("referenceNumber") or f"RFD-{int(datetime.now().timestamp())}"
    entries = [
        LedgerEntryInput(fundId=group_fund.id, isCredit=False, amount=payload["amount"]),
        LedgerEntryInput(fundId=general_fund.id, isCredit=True, amount=payload["amount"]),
    ]

    ledger_tx = LedgerEngine.create_transaction(
        db=db,
        date=p_date,
        type="CONTRIBUTION_REFUND",
        entries=entries,
        reference_id=ref_no,
        member_id=member.id,
        notes=payload.get("notes") or "Contribution Refund",
        created_by=current_user.id
    )

    mc = MonthlyContribution(
        memberId=member.id,
        month=p_date.month,
        year=p_date.year,
        expectedAmount=payload["amount"],
        isAdditional=True,
        status="PAID",
        createdBy=current_user.id
    )
    db.add(mc)
    db.flush()

    payment = ContributionPayment(
        monthlyContributionId=mc.id,
        ledgerTransactionId=ledger_tx.id,
        amount=payload["amount"],
        paymentDate=p_date,
        paymentMethod=payload.get("paymentMethod", "CASH"),
        referenceNumber=ref_no,
        notes=payload.get("notes"),
        createdBy=current_user.id
    )
    db.add(payment)
    db.commit()
    return APIResponse(success=True, data={"message": "Refund processed successfully."})

@router.post("/adjustment", response_model=APIResponse[dict])
def create_contribution_adjustment(
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Fund Collection", "Add"))
):
    member = db.query(Member).filter(Member.id == payload["memberId"]).first()
    if not member:
        raise NotFoundException("Member not found.")

    p_date = datetime.fromisoformat(payload["paymentDate"].replace("Z", "+00:00"))
    group_fund, general_fund = LedgerEngine.get_or_create_funds(db, member.groupId)
    is_credit = payload.get("adjustmentType") == "CREDIT"
    ref_no = payload.get("referenceNumber") or f"ADJ-{int(datetime.now().timestamp())}"

    entries = (
        [
            LedgerEntryInput(fundId=general_fund.id, isCredit=False, amount=payload["amount"]),
            LedgerEntryInput(fundId=group_fund.id, isCredit=True, amount=payload["amount"]),
        ]
        if is_credit
        else [
            LedgerEntryInput(fundId=group_fund.id, isCredit=False, amount=payload["amount"]),
            LedgerEntryInput(fundId=general_fund.id, isCredit=True, amount=payload["amount"]),
        ]
    )

    ledger_tx = LedgerEngine.create_transaction(
        db=db,
        date=p_date,
        type="CONTRIBUTION_ADJUSTMENT",
        entries=entries,
        reference_id=ref_no,
        member_id=member.id,
        notes=payload.get("notes") or "Contribution Adjustment",
        created_by=current_user.id
    )

    mc = MonthlyContribution(
        memberId=member.id,
        month=p_date.month,
        year=p_date.year,
        expectedAmount=payload["amount"],
        isAdditional=True,
        status="PAID",
        createdBy=current_user.id
    )
    db.add(mc)
    db.flush()

    payment = ContributionPayment(
        monthlyContributionId=mc.id,
        ledgerTransactionId=ledger_tx.id,
        amount=payload["amount"],
        paymentDate=p_date,
        paymentMethod=payload.get("paymentMethod", "CASH"),
        referenceNumber=ref_no,
        notes=payload.get("notes"),
        createdBy=current_user.id
    )
    db.add(payment)
    db.commit()
    return APIResponse(success=True, data={"message": "Adjustment processed successfully."})

@router.get("/filter-options", response_model=APIResponse[dict])
def get_contribution_filter_options(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Fund Collection", "View"))
):
    members = db.query(Member).filter(Member.status != "DELETED").order_by(Member.fullName.asc()).all()
    collectors = [c[0] for c in db.query(ContributionPayment.createdBy).distinct().all() if c[0]]
    methods = [m[0] for m in db.query(ContributionPayment.paymentMethod).distinct().all() if m[0]]

    return APIResponse(success=True, data={
        "members": [{"id": m.id, "memberId": m.memberId, "fullName": m.fullName} for m in members],
        "collectors": collectors,
        "paymentMethods": methods
    })

@router.get("/summary", response_model=APIResponse[dict])
def get_contributions_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Fund Collection", "View"))
):
    from sqlalchemy import func
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    start_date = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
    if target_month == 12:
        end_date = datetime(target_year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(target_year, target_month + 1, 1, tzinfo=timezone.utc)

    total_collected_month = (
        db.query(func.sum(ContributionPayment.amount))
        .filter(ContributionPayment.paymentDate >= start_date, ContributionPayment.paymentDate < end_date)
        .scalar()
    ) or 0

    total_collected_all = db.query(func.sum(ContributionPayment.amount)).scalar() or 0

    return APIResponse(success=True, data={
        "collectedThisMonth": total_collected_month,
        "totalCollected": total_collected_all,
        "month": target_month,
        "year": target_year
    })


