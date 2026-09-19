from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.loan import LoanResponse, LoanCreate, LoanUpdate, LoanRepaymentCreate, LoanRepaymentResponse
from app.schemas.ledger import LedgerEntryInput
from app.models import Loan, LoanRepayment, Beneficiary, FundAllocation, Fund
from app.services.ledger_engine import LedgerEngine
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

def generate_loan_number(db: Session) -> str:
    count = db.query(Loan).count()
    year = datetime.now(timezone.utc).year
    return f"L-{year}-{str(count + 1).zfill(4)}"

@router.get("", response_model=APIResponse[List[LoanResponse]])
def get_loans(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Loans", "View"))
):
    query = db.query(Loan)
    if status:
        query = query.filter(Loan.status == status)
    loans = query.order_by(Loan.createdAt.desc()).all()
    return APIResponse(success=True, data=loans)

@router.get("/{id}", response_model=APIResponse[LoanResponse])
def get_loan(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Loans", "View"))
):
    loan = db.query(Loan).filter(Loan.id == id).first()
    if not loan:
        raise NotFoundException("Loan not found.")
    return APIResponse(success=True, data=loan)

@router.post("", response_model=APIResponse[LoanResponse])
@router.post("/", response_model=APIResponse[LoanResponse], include_in_schema=False)
@router.post("/issue", response_model=APIResponse[LoanResponse], include_in_schema=False)
def create_loan(
    payload: LoanCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Loans", "Add"))
):
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == payload.beneficiaryId).first()
    if not beneficiary:
        raise NotFoundException("Beneficiary not found.")

    loan_number = generate_loan_number(db)
    now = datetime.now(timezone.utc)

    # Auto-derive installment amount if not explicitly provided or <= 0
    installment_amt = payload.installmentAmount
    if (installment_amt is None or installment_amt <= 0) and payload.totalInstallments and payload.totalInstallments > 0:
        installment_amt = payload.amount // payload.totalInstallments
    elif installment_amt is None:
        installment_amt = payload.amount

    # 1. Create Loan
    loan = Loan(
        loanNumber=loan_number,
        beneficiaryId=payload.beneficiaryId,
        memberId=beneficiary.memberId,
        amount=payload.amount,
        loanType=payload.loanType,
        businessType=payload.businessType if payload.loanType == "BUSINESS" else None,
        purpose=payload.purpose,
        installmentType=payload.installmentType,
        installmentAmount=installment_amt,
        totalInstallments=payload.totalInstallments,
        firstInstallmentDate=payload.firstInstallmentDate,
        nextDueDate=payload.firstInstallmentDate,
        totalPaidAmount=0,
        remainingBalance=payload.amount,
        status="ACTIVE",
        disbursedDate=now,
        notes=payload.notes,
        createdBy=current_user.id
    )
    db.add(loan)
    db.flush()

    # 2. Fund Allocations & Double Entry Transactions
    ledger_entries = []
    for alloc in payload.fundAllocations:
        group_fund, general_fund = LedgerEngine.get_or_create_funds(db, alloc.groupId)

        # Debit Group Fund (Asset/Equity decreases)
        ledger_entries.append(LedgerEntryInput(fundId=group_fund.id, isCredit=False, amount=alloc.amount))
        # Credit General Fund (Cash asset disbursed)
        ledger_entries.append(LedgerEntryInput(fundId=general_fund.id, isCredit=True, amount=alloc.amount))

        db.add(FundAllocation(
            fundId=group_fund.id,
            targetType="LOAN",
            loanId=loan.id,
            amount=alloc.amount,
            createdBy=current_user.id
        ))

    LedgerEngine.create_transaction(
        db=db,
        date=now,
        type="LOAN",
        entries=ledger_entries,
        reference_id=loan_number,
        member_id=beneficiary.memberId,
        notes=f"Loan disbursed: {loan_number}",
        created_by=current_user.id
    )

    db.commit()
    db.refresh(loan)
    return APIResponse(success=True, data=loan)

@router.post("/{id}/repay", response_model=APIResponse[dict])
@router.post("/{id}/repayments", response_model=APIResponse[dict], include_in_schema=False)
def repay_loan(
    id: str,
    payload: LoanRepaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Loans", "Receive Installment"))
):
    loan = db.query(Loan).filter(Loan.id == id).first()
    if not loan:
        raise NotFoundException("Loan not found.")

    if loan.status not in ["ACTIVE", "DEFAULTED"]:
        raise APIException("Loan is not in active repayment status.", code="LOAN_INACTIVE")

    raw_date = payload.date or payload.paymentDate or datetime.now(timezone.utc).isoformat()
    repay_dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))

    # Determine Group Fund from loan's first allocation
    alloc = db.query(FundAllocation).filter(FundAllocation.loanId == loan.id).first()
    fund = alloc.fund if alloc else None
    group_id = fund.groupId if fund else None

    group_fund, general_fund = LedgerEngine.get_or_create_funds(db, group_id)

    # Double Entry:
    # Debit General Fund (Cash asset increases)
    # Credit Group Fund (Equity returns)
    entries = [
        LedgerEntryInput(fundId=general_fund.id, isCredit=False, amount=payload.amount),
        LedgerEntryInput(fundId=group_fund.id, isCredit=True, amount=payload.amount)
    ]

    ledger_tx = LedgerEngine.create_transaction(
        db=db,
        date=repay_dt,
        type="REPAYMENT",
        entries=entries,
        reference_id=loan.loanNumber,
        member_id=loan.memberId,
        notes=payload.notes or f"Loan repayment for {loan.loanNumber}",
        created_by=current_user.id
    )

    repayment = LoanRepayment(
        loanId=loan.id,
        ledgerTransactionId=ledger_tx.id,
        amount=payload.amount,
        date=repay_dt,
        status="COMPLETED",
        installmentNo=payload.installmentNo,
        paymentMethod=payload.paymentMethod,
        referenceNumber=payload.referenceNumber,
        notes=payload.notes,
        collectedBy=payload.collectedBy or current_user.id,
        receiptUrl=payload.receiptUrl,
        createdBy=current_user.id
    )
    db.add(repayment)

    # Update loan balances
    loan.totalPaidAmount = (loan.totalPaidAmount or 0) + payload.amount
    loan.remainingBalance = max(0, loan.amount - loan.totalPaidAmount)
    if loan.remainingBalance == 0:
        loan.status = "COMPLETED"

    db.commit()
    return APIResponse(success=True, data={
        "message": "Repayment recorded successfully.",
        "remainingBalance": loan.remainingBalance,
        "loanStatus": loan.status
    })

@router.put("/{id}", response_model=APIResponse[LoanResponse])
@router.patch("/{id}", response_model=APIResponse[LoanResponse], include_in_schema=False)
def update_loan(
    id: str,
    payload: LoanUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Loans", "Edit"))
):
    loan = db.query(Loan).filter(Loan.id == id).first()
    if not loan:
        raise NotFoundException("Loan not found.")

    update_dict = payload.model_dump(exclude_unset=True)

    # Auto derive installmentAmount if totalInstallments or amount updated without installmentAmount
    if ("totalInstallments" in update_dict or "amount" in update_dict) and "installmentAmount" not in update_dict:
        new_amount = update_dict.get("amount", loan.amount)
        new_installments = update_dict.get("totalInstallments", loan.totalInstallments)
        if new_installments and new_installments > 0:
            loan.installmentAmount = new_amount // new_installments

    for k, v in update_dict.items():
        setattr(loan, k, v)

    loan.updatedBy = current_user.id
    db.commit()
    db.refresh(loan)
    return APIResponse(success=True, data=loan)

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_loan(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Loans", "Delete"))
):
    loan = db.query(Loan).filter(Loan.id == id).first()
    if not loan:
        raise NotFoundException("Loan not found.")

    db.query(FundAllocation).filter(FundAllocation.loanId == loan.id).delete(synchronize_session=False)
    db.query(LoanRepayment).filter(LoanRepayment.loanId == loan.id).delete(synchronize_session=False)
    db.delete(loan)
    db.commit()
    return APIResponse(success=True, data={"message": "Loan deleted successfully."})
