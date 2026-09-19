from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.donor import (
    DonorResponse,
    DonorCreate,
    DonorUpdate,
    ReceiveDonationRequest,
    DonationTransactionItem
)
from app.schemas.ledger import LedgerEntryInput
from app.models import Donor, Member, Group, LedgerTransaction, LedgerEntry
from app.services.ledger_engine import LedgerEngine
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

def generate_donor_id(db: Session) -> str:
    count = db.query(Donor).count()
    return f"DNR-{str(count + 1).zfill(4)}"

@router.get("", response_model=APIResponse[List[DonorResponse]])
def get_donors(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Donors", "View"))
):
    donors = db.query(Donor).order_by(Donor.createdAt.desc()).all()
    return APIResponse(success=True, data=donors)

@router.get("/donations", response_model=APIResponse[List[DonationTransactionItem]])
def get_received_donations(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Donors", "View"))
):
    txs = (
        db.query(LedgerTransaction)
        .filter(LedgerTransaction.type == "DONATION")
        .order_by(LedgerTransaction.date.desc())
        .all()
    )

    items = []
    for tx in txs:
        # Find group entry
        group_entry = next((e for e in tx.entries if e.isCredit), None)
        group_name = group_entry.groupName if group_entry and group_entry.groupName else "General"
        group_id = group_entry.groupId if group_entry else None
        amount = group_entry.amount if group_entry else 0

        source_type = "MEMBER" if tx.memberId else "DONOR"
        member_dict = None
        if tx.member:
            member_dict = {
                "id": tx.member.id,
                "memberId": tx.member.memberId,
                "fullName": tx.member.fullName,
                "mobile": tx.member.mobile,
                "groupName": tx.member.group.name if tx.member.group else None
            }

        donor_dict = None
        if tx.donor:
            donor_dict = {
                "id": tx.donor.id,
                "donorId": tx.donor.donorId,
                "fullName": tx.donor.fullName,
                "mobile": tx.donor.mobile,
                "address": tx.donor.address,
                "nationalId": tx.donor.nationalId
            }

        items.append(DonationTransactionItem(
            id=tx.id,
            date=tx.date.strftime("%Y-%m-%d"),
            voucherNo=tx.referenceId or f"DON-{tx.id[:8].upper()}",
            sourceType=source_type,
            donorId=tx.donorId,
            donor=donor_dict,
            memberId=tx.memberId,
            member=member_dict,
            groupId=group_id,
            groupName=group_name,
            amount=amount,
            remarks=tx.notes or "",
            createdBy=tx.createdBy or "System",
            status=tx.status,
            createdAt=tx.createdAt.isoformat()
        ))

    return APIResponse(success=True, data=items)

@router.post("/receive", response_model=APIResponse[dict])
def receive_donation(
    payload: ReceiveDonationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Donors", "Receive Installment"))
):
    source_type = payload.sourceType or ("MEMBER" if payload.memberId else "DONOR")
    final_member_id = None
    final_donor_id = None

    if source_type == "MEMBER":
        if not payload.memberId:
            raise APIException("Foundation Member is required for member donation.", code="MEMBER_REQUIRED")
        final_member_id = payload.memberId
    elif source_type == "DONOR":
        if not payload.donorId:
            raise APIException("External Donor is required for donor donation.", code="DONOR_REQUIRED")
        final_donor_id = payload.donorId
    else:
        raise APIException("Invalid donation source type.", code="INVALID_SOURCE")

    group_fund, general_fund = LedgerEngine.get_or_create_funds(db, payload.groupId)
    ref_id = final_member_id or final_donor_id

    tx_date = datetime.fromisoformat(payload.date.replace("Z", "+00:00"))

    # Balanced entries:
    # Debit General Fund (Cash asset increases)
    # Credit Group Fund (Equity increases)
    entries = [
        LedgerEntryInput(fundId=general_fund.id, isCredit=False, amount=payload.amount),
        LedgerEntryInput(fundId=group_fund.id, isCredit=True, amount=payload.amount),
    ]

    tx = LedgerEngine.create_transaction(
        db=db,
        date=tx_date,
        type="DONATION",
        entries=entries,
        reference_id=ref_id,
        member_id=final_member_id,
        donor_id=final_donor_id,
        notes=payload.remarks or "Group Donation",
        created_by=current_user.id
    )

    db.commit()
    return APIResponse(success=True, data={"message": "Donation received successfully.", "transactionId": tx.id})

@router.get("/{id}", response_model=APIResponse[DonorResponse])
def get_donor(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Donors", "View"))
):
    d = db.query(Donor).filter(Donor.id == id).first()
    if not d:
        raise NotFoundException("Donor not found.")
    return APIResponse(success=True, data=d)

@router.post("", response_model=APIResponse[DonorResponse])
def create_donor(
    payload: DonorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Donors", "Add"))
):
    mobile = payload.mobile.strip() if payload.mobile and payload.mobile.strip() else None
    national_id = payload.nationalId.strip() if payload.nationalId and payload.nationalId.strip() else None

    if mobile and db.query(Donor).filter(Donor.mobile == mobile).first():
        raise APIException("Donor with this mobile number already exists.", code="DUPLICATE_MOBILE")

    if national_id and db.query(Donor).filter(Donor.nationalId == national_id).first():
        raise APIException("Donor with this National ID already exists.", code="DUPLICATE_NID")

    donor_id = generate_donor_id(db)
    donor_data = payload.model_dump()
    donor_data["mobile"] = mobile
    donor_data["nationalId"] = national_id

    d = Donor(
        donorId=donor_id,
        createdBy=current_user.id,
        **donor_data
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return APIResponse(success=True, data=d)

@router.put("/{id}", response_model=APIResponse[DonorResponse])
def update_donor(
    id: str,
    payload: DonorUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Donors", "Edit"))
):
    d = db.query(Donor).filter(Donor.id == id).first()
    if not d:
        raise NotFoundException("Donor not found.")

    update_dict = payload.model_dump(exclude_unset=True)
    if "mobile" in update_dict:
        update_dict["mobile"] = update_dict["mobile"].strip() if update_dict["mobile"] and update_dict["mobile"].strip() else None
        if update_dict["mobile"] and update_dict["mobile"] != d.mobile:
            if db.query(Donor).filter(Donor.mobile == update_dict["mobile"], Donor.id != id).first():
                raise APIException("Donor with this mobile number already exists.", code="DUPLICATE_MOBILE")

    if "nationalId" in update_dict:
        update_dict["nationalId"] = update_dict["nationalId"].strip() if update_dict["nationalId"] and update_dict["nationalId"].strip() else None
        if update_dict["nationalId"] and update_dict["nationalId"] != d.nationalId:
            if db.query(Donor).filter(Donor.nationalId == update_dict["nationalId"], Donor.id != id).first():
                raise APIException("Donor with this National ID already exists.", code="DUPLICATE_NID")

    for key, value in update_dict.items():
        setattr(d, key, value)

    d.updatedBy = current_user.id
    db.commit()
    db.refresh(d)
    return APIResponse(success=True, data=d)

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_donor(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Donors", "Delete"))
):
    d = db.query(Donor).filter(Donor.id == id).first()
    if not d:
        raise NotFoundException("Donor not found.")
    d.status = "INACTIVE"
    db.commit()
    return APIResponse(success=True, data={"message": "Donor marked as inactive."})

@router.delete("/donations/{transaction_id}", response_model=APIResponse[dict])
def delete_donation_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Donors", "Delete"))
):
    tx = db.query(LedgerTransaction).filter(LedgerTransaction.id == transaction_id, LedgerTransaction.type == "DONATION").first()
    if not tx:
        raise NotFoundException("Donation transaction not found.")

    db.query(LedgerEntry).filter(LedgerEntry.ledgerTransactionId == transaction_id).delete()
    db.delete(tx)
    db.commit()
    return APIResponse(success=True, data={"message": "Donation transaction deleted successfully."})

@router.put("/donations/{transaction_id}", response_model=APIResponse[dict])
def update_donation_transaction(
    transaction_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Donors", "Edit"))
):
    from datetime import datetime
    tx = db.query(LedgerTransaction).filter(LedgerTransaction.id == transaction_id, LedgerTransaction.type == "DONATION").first()
    if not tx:
        raise NotFoundException("Donation transaction not found.")

    if "date" in payload and payload["date"]:
        tx.date = datetime.fromisoformat(payload["date"].replace("Z", "+00:00"))
    if "remarks" in payload:
        tx.notes = payload["remarks"]
    if "amount" in payload and payload["amount"]:
        for e in tx.entries:
            e.amount = int(payload["amount"])

    db.commit()
    return APIResponse(success=True, data={"message": "Donation transaction updated successfully."})

