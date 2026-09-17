from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.grant import GrantResponse, GrantCreate, GrantUpdate
from app.schemas.ledger import LedgerEntryInput
from app.models import Grant, Beneficiary, FundAllocation
from app.services.ledger_engine import LedgerEngine
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

def generate_grant_number(db: Session) -> str:
    count = db.query(Grant).count()
    year = datetime.now(timezone.utc).year
    return f"GRN-{year}-{str(count + 1).zfill(4)}"

@router.get("", response_model=APIResponse[List[GrantResponse]])
def get_grants(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Grants", "View"))
):
    grants = db.query(Grant).order_by(Grant.createdAt.desc()).all()
    return APIResponse(success=True, data=grants)

@router.get("/{id}", response_model=APIResponse[GrantResponse])
def get_grant(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Grants", "View"))
):
    grant = db.query(Grant).filter(Grant.id == id).first()
    if not grant:
        raise NotFoundException("Grant not found.")
    return APIResponse(success=True, data=grant)

@router.post("", response_model=APIResponse[GrantResponse])
def create_grant(
    payload: GrantCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Grants", "Add"))
):
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == payload.beneficiaryId).first()
    if not beneficiary:
        raise NotFoundException("Beneficiary not found.")

    grant_number = generate_grant_number(db)
    grant_dt = datetime.fromisoformat(payload.grantDate.replace("Z", "+00:00"))

    grant = Grant(
        grantNumber=grant_number,
        beneficiaryId=payload.beneficiaryId,
        amount=payload.amount,
        purpose=payload.grantReason,
        dateApproved=grant_dt,
        disbursedDate=grant_dt,
        status="PAID",
        notes=payload.comment or "",
        createdBy=current_user.id
    )
    db.add(grant)
    db.flush()

    ledger_entries = []
    for alloc in payload.allocations:
        group_fund, general_fund = LedgerEngine.get_or_create_funds(db, alloc.groupId)

        # Debit Group Fund (Equity decreases)
        ledger_entries.append(LedgerEntryInput(fundId=group_fund.id, isCredit=False, amount=alloc.amount))
        # Credit General Fund (Cash asset decreases)
        ledger_entries.append(LedgerEntryInput(fundId=general_fund.id, isCredit=True, amount=alloc.amount))

        db.add(FundAllocation(
            fundId=group_fund.id,
            targetType="GRANT",
            grantId=grant.id,
            amount=alloc.amount,
            createdBy=current_user.id
        ))

    LedgerEngine.create_transaction(
        db=db,
        date=grant_dt,
        type="GRANT",
        entries=ledger_entries,
        reference_id=grant_number,
        notes=payload.comment,
        created_by=current_user.id
    )

    db.commit()
    db.refresh(grant)
    return APIResponse(success=True, data=grant)

@router.put("/{id}", response_model=APIResponse[GrantResponse])
def update_grant(
    id: str,
    payload: GrantUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Grants", "Edit"))
):
    grant = db.query(Grant).filter(Grant.id == id).first()
    if not grant:
        raise NotFoundException("Grant not found.")

    update_dict = payload.model_dump(exclude_unset=True)
    if "grantReason" in update_dict:
        grant.purpose = update_dict.pop("grantReason")
    if "comment" in update_dict:
        grant.notes = update_dict.pop("comment")
    if "grantDate" in update_dict and update_dict["grantDate"]:
        grant.dateApproved = datetime.fromisoformat(update_dict.pop("grantDate").replace("Z", "+00:00"))

    for k, v in update_dict.items():
        setattr(grant, k, v)

    grant.updatedBy = current_user.id
    db.commit()
    db.refresh(grant)
    return APIResponse(success=True, data=grant)
