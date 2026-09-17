from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.member import MemberResponse, MemberCreate, MemberUpdate, MemberDueItem
from app.models import Member, Group, Document, MemberStatusHistory
from app.services.member_service import MemberService
from app.dependencies.permissions import require_permission
from app.dependencies.auth import get_current_active_user
from app.core.exceptions import NotFoundException, APIException

router = APIRouter()

@router.get("", response_model=APIResponse[List[MemberResponse]])
def get_members(
    status: Optional[str] = None,
    groupId: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Members", "View"))
):
    query = db.query(Member).filter(Member.status != "DELETED")
    if status:
        query = query.filter(Member.status == status)
    if groupId:
        query = query.filter(Member.groupId == groupId)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Member.fullName.ilike(s)) |
            (Member.memberId.ilike(s)) |
            (Member.mobile.ilike(s)) |
            (Member.nationalId.ilike(s))
        )
    members = query.order_by(Member.createdAt.desc()).all()
    return APIResponse(success=True, data=members)

@router.get("/dues", response_model=APIResponse[List[MemberDueItem]])
@router.get("/dues/list", response_model=APIResponse[List[MemberDueItem]])
def get_member_dues(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Members", "View"))
):
    dues = MemberService.get_member_dues_list(db)
    return APIResponse(success=True, data=dues)

@router.get("/generate-id", response_model=APIResponse[dict])
def generate_member_id(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Members", "Add"))
):
    next_id = MemberService.generate_member_id(db)
    return APIResponse(success=True, data={"memberId": next_id})

@router.get("/{id}", response_model=APIResponse[MemberResponse])
def get_member(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Members", "View"))
):
    member = db.query(Member).filter(Member.id == id).first()
    if not member:
        raise NotFoundException("Member not found.")
    return APIResponse(success=True, data=member)

@router.post("", response_model=APIResponse[MemberResponse])
def create_member(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Members", "Add"))
):
    # Verify group exists
    group = db.query(Group).filter(Group.id == payload.groupId).first()
    if not group:
        raise APIException("Selected group not found.", code="GROUP_NOT_FOUND")

    # Generate or validate memberId
    member_id = payload.memberId or MemberService.generate_member_id(db)
    existing_m = db.query(Member).filter(Member.memberId == member_id).first()
    if existing_m:
        member_id = MemberService.generate_member_id(db)

    # Check unique fields
    if payload.mobile:
        if db.query(Member).filter(Member.mobile == payload.mobile).first():
            raise APIException("Mobile number already registered to another member.", code="DUPLICATE_MOBILE")
    if payload.nationalId:
        if db.query(Member).filter(Member.nationalId == payload.nationalId).first():
            raise APIException("National ID already registered to another member.", code="DUPLICATE_NID")
    if payload.email:
        if db.query(Member).filter(Member.email == payload.email).first():
            raise APIException("Email already registered to another member.", code="DUPLICATE_EMAIL")

    member_data = payload.model_dump(exclude={"photoBase64", "nidFrontBase64", "nidBackBase64", "memberId"})
    member = Member(
        memberId=member_id,
        createdBy=current_user.id,
        **member_data
    )
    db.add(member)
    db.flush()

    # Record status history
    db.add(MemberStatusHistory(
        memberId=member.id,
        fromStatus="NONE",
        toStatus=member.status,
        reason="Initial member registration",
        changedBy=current_user.id
    ))

    db.commit()
    db.refresh(member)
    return APIResponse(success=True, data=member)

@router.put("/{id}", response_model=APIResponse[MemberResponse])
def update_member(
    id: str,
    payload: MemberUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Members", "Edit"))
):
    member = db.query(Member).filter(Member.id == id).first()
    if not member:
        raise NotFoundException("Member not found.")

    update_dict = payload.model_dump(exclude_unset=True, exclude={"photoBase64", "nidFrontBase64", "nidBackBase64"})

    # Check unique constraints if fields modified
    if "mobile" in update_dict and update_dict["mobile"] and update_dict["mobile"] != member.mobile:
        if db.query(Member).filter(Member.mobile == update_dict["mobile"], Member.id != id).first():
            raise APIException("Mobile number already registered to another member.", code="DUPLICATE_MOBILE")

    if "nationalId" in update_dict and update_dict["nationalId"] and update_dict["nationalId"] != member.nationalId:
        if db.query(Member).filter(Member.nationalId == update_dict["nationalId"], Member.id != id).first():
            raise APIException("National ID already registered to another member.", code="DUPLICATE_NID")

    if "status" in update_dict and update_dict["status"] != member.status:
        db.add(MemberStatusHistory(
            memberId=member.id,
            fromStatus=member.status,
            toStatus=update_dict["status"],
            reason="Status updated by admin",
            changedBy=current_user.id
        ))

    for key, value in update_dict.items():
        setattr(member, key, value)

    member.updatedBy = current_user.id
    db.commit()
    db.refresh(member)
    return APIResponse(success=True, data=member)

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_member(
    id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Members", "Delete"))
):
    member = db.query(Member).filter(Member.id == id).first()
    if not member:
        raise NotFoundException("Member not found.")

    member.status = "DELETED"
    member.updatedBy = current_user.id

    db.add(MemberStatusHistory(
        memberId=member.id,
        fromStatus=member.status,
        toStatus="DELETED",
        reason="Soft-deleted by admin",
        changedBy=current_user.id
    ))
    db.commit()
    return APIResponse(success=True, data={"message": "Member successfully marked as deleted."})
