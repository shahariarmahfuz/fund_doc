from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import re
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.beneficiary import BeneficiaryResponse, BeneficiaryCreate, BeneficiaryUpdate
from app.models import Beneficiary, Member
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

def generate_beneficiary_id(db: Session) -> str:
    count = db.query(Beneficiary).count()
    next_num = count + 1
    return f"BEN-{str(next_num).zfill(4)}"

@router.get("", response_model=APIResponse[List[BeneficiaryResponse]])
def get_beneficiaries(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Beneficiaries", "View"))
):
    query = db.query(Beneficiary)
    if status:
        query = query.filter(Beneficiary.status == status)
    beneficiaries = query.order_by(Beneficiary.createdAt.desc()).all()
    return APIResponse(success=True, data=beneficiaries)

@router.get("/{id}", response_model=APIResponse[BeneficiaryResponse])
def get_beneficiary(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Beneficiaries", "View"))
):
    b = db.query(Beneficiary).filter(Beneficiary.id == id).first()
    if not b:
        raise NotFoundException("Beneficiary not found.")
    return APIResponse(success=True, data=b)

@router.post("", response_model=APIResponse[BeneficiaryResponse])
def create_beneficiary(
    payload: BeneficiaryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Beneficiaries", "Add"))
):
    if payload.memberId:
        m = db.query(Member).filter(Member.id == payload.memberId).first()
        if not m:
            raise APIException("Selected member not found.", code="MEMBER_NOT_FOUND")

    beneficiary_id = generate_beneficiary_id(db)
    b = Beneficiary(
        beneficiaryId=beneficiary_id,
        createdBy=current_user.id,
        **payload.model_dump()
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return APIResponse(success=True, data=b)

@router.put("/{id}", response_model=APIResponse[BeneficiaryResponse])
def update_beneficiary(
    id: str,
    payload: BeneficiaryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Beneficiaries", "Edit"))
):
    b = db.query(Beneficiary).filter(Beneficiary.id == id).first()
    if not b:
        raise NotFoundException("Beneficiary not found.")

    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(b, key, value)

    b.updatedBy = current_user.id
    db.commit()
    db.refresh(b)
    return APIResponse(success=True, data=b)

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_beneficiary(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Beneficiaries", "Delete"))
):
    b = db.query(Beneficiary).filter(Beneficiary.id == id).first()
    if not b:
        raise NotFoundException("Beneficiary not found.")

    b.status = "INACTIVE"
    db.commit()
    return APIResponse(success=True, data={"message": "Beneficiary marked as inactive."})
