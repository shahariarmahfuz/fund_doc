from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.cache import app_cache
from app.schemas.common import APIResponse
from app.schemas.group import GroupResponse, GroupCreate, GroupUpdate
from app.models import Group, Foundation, Member, Fund, User
from app.services.finance_service import FinancialService
from app.services.group_service import GroupService
from app.dependencies.permissions import require_permission, require_super_admin
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

@router.get("", response_model=APIResponse[List[GroupResponse]])
def get_groups(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Groups", "View"))
):
    cached_groups = app_cache.get("groups_list")
    if cached_groups is not None:
        return APIResponse(success=True, data=cached_groups)

    groups = db.query(Group).order_by(Group.isFoundationGroup.desc(), Group.createdAt.desc()).all()
    summaries = FinancialService.get_all_group_summaries(db)
    summary_map = {s["groupId"]: s["currentBalance"] for s in summaries}

    # Batch compute member counts for all groups in 1 single query
    member_counts = dict(
        db.query(Member.groupId, func.count(Member.id))
        .filter(Member.status != "DELETED", Member.groupId.isnot(None))
        .group_by(Member.groupId)
        .all()
    )

    result = []
    for g in groups:
        member_count = member_counts.get(g.id, 0)
        current_fund = summary_map.get(g.id, 0.0)
        res_item = GroupResponse(
            id=g.id,
            foundationId=g.foundationId,
            name=g.name,
            code=g.code,
            shortName=g.shortName,
            description=g.description,
            remarks=g.remarks,
            status=g.status,
            isFoundationGroup=g.isFoundationGroup,
            memberSignupEnabled=g.memberSignupEnabled,
            createdAt=g.createdAt,
            updatedAt=g.updatedAt,
            createdBy=g.createdBy,
            updatedBy=g.updatedBy,
            memberCount=member_count,
            currentFund=float(current_fund)
        )
        result.append(res_item)

    app_cache.set("groups_list", result, ttl=60, tags=["groups"])
    return APIResponse(success=True, data=result)

@router.get("/signup-eligible", response_model=APIResponse[List[GroupResponse]])
def get_member_signup_groups(db: Session = Depends(get_db)):
    """Public/semi-public endpoint for member registration form options."""
    groups = (
        db.query(Group)
        .filter(
            Group.status == "ACTIVE",
            Group.memberSignupEnabled.is_(True),
            Group.isFoundationGroup.is_(False)
        )
        .order_by(Group.name.asc())
        .all()
    )
    result = [GroupResponse.model_validate(g) for g in groups]
    return APIResponse(success=True, data=result)

@router.get("/{id}", response_model=APIResponse[GroupResponse])
def get_group(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Groups", "View"))
):
    group = db.query(Group).filter(Group.id == id).first()
    if not group:
        raise NotFoundException("Group not found.")

    member_count = db.query(Member).filter(Member.groupId == group.id).count()
    summary = FinancialService.get_group_fund_summary(db, group.id)

    res = GroupResponse(
        id=group.id,
        foundationId=group.foundationId,
        name=group.name,
        code=group.code,
        shortName=group.shortName,
        description=group.description,
        remarks=group.remarks,
        status=group.status,
        isFoundationGroup=group.isFoundationGroup,
        memberSignupEnabled=group.memberSignupEnabled,
        createdAt=group.createdAt,
        updatedAt=group.updatedAt,
        createdBy=group.createdBy,
        updatedBy=group.updatedBy,
        memberCount=member_count,
        currentFund=float(summary.get("currentBalance", 0.0))
    )
    return APIResponse(success=True, data=res)

@router.post("", response_model=APIResponse[GroupResponse])
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Groups", "Add"))
):
    # Ensure code uniqueness
    if db.query(Group).filter(Group.code == payload.code).first():
        raise APIException("Group code already in use.", code="DUPLICATE_CODE")

    # If isFoundationGroup, ensure only one exists
    if payload.isFoundationGroup:
        existing = db.query(Group).filter(Group.isFoundationGroup.is_(True)).first()
        if existing:
            raise APIException("Only one central Foundation group may exist.", code="DUPLICATE_FOUNDATION_GROUP")

    foundation = db.query(Foundation).first()
    if not foundation:
        foundation = Foundation(name="Main Foundation", description="Auto-generated")
        db.add(foundation)
        db.flush()

    is_foundation = payload.isFoundationGroup or False
    signup_enabled = False if is_foundation else payload.memberSignupEnabled

    group = Group(
        foundationId=foundation.id,
        name=payload.name,
        code=payload.code,
        shortName=payload.shortName,
        description=payload.description,
        remarks=payload.remarks,
        status=payload.status,
        isFoundationGroup=is_foundation,
        memberSignupEnabled=signup_enabled,
        createdBy=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    app_cache.invalidate_tag("groups")
    app_cache.invalidate_tag("dashboard")
    return APIResponse(success=True, data=GroupResponse.model_validate(group))

@router.put("/{id}", response_model=APIResponse[GroupResponse])
def update_group(
    id: str,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Groups", "Edit"))
):
    group = db.query(Group).filter(Group.id == id).first()
    if not group:
        raise NotFoundException("Group not found.")

    update_dict = payload.model_dump(exclude_unset=True)

    if "code" in update_dict and update_dict["code"] and update_dict["code"] != group.code:
        if db.query(Group).filter(Group.code == update_dict["code"], Group.id != id).first():
            raise APIException("Group code already exists.", code="DUPLICATE_CODE")

    for key, value in update_dict.items():
        setattr(group, key, value)

    group.updatedBy = current_user.id
    db.commit()
    db.refresh(group)
    app_cache.invalidate_tag("groups")
    app_cache.invalidate_tag("dashboard")
    return APIResponse(success=True, data=GroupResponse.model_validate(group))

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_group(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    True Hard Delete for a Group.
    Exclusively available to Super Admin.
    Permanently removes the Group and all Group-owned dependent records
    in a single atomic transaction.
    """
    result = GroupService.hard_delete_group(db, group_id=id, current_user_id=current_user.id)
    app_cache.invalidate_tag("groups")
    app_cache.invalidate_tag("dashboard")
    return APIResponse(success=True, data=result)

@router.get("/{id}/members", response_model=APIResponse[List[dict]])
def get_group_members(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Groups", "View"))
):
    members = db.query(Member).filter(Member.groupId == id, Member.status != "DELETED").order_by(Member.createdAt.desc()).all()
    results = [
        {
            "id": m.id,
            "memberId": m.memberId,
            "fullName": m.fullName,
            "mobile": m.mobile,
            "email": m.email,
            "status": m.status,
            "position": m.position,
            "joinDate": m.joinDate.isoformat() if m.joinDate else None,
            "createdAt": m.createdAt.isoformat() if m.createdAt else None
        }
        for m in members
    ]
    return APIResponse(success=True, data=results)

@router.get("/{id}/summary", response_model=APIResponse[dict])
def get_group_summary(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Groups", "View"))
):
    summary = FinancialService.get_group_fund_summary(db, id)
    return APIResponse(success=True, data=summary)

@router.get("/{id}/balance", response_model=APIResponse[dict])
def get_group_balance(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Groups", "View"))
):
    group = db.query(Group).filter(Group.id == id).first()
    if not group:
        raise NotFoundException("Group not found.")
    summary = FinancialService.get_group_fund_summary(db, id)
    return APIResponse(success=True, data={
        "groupId": group.id,
        "groupName": group.name,
        "currentBalance": float(summary.get("currentBalance", 0.0))
    })

@router.get("/{id}/ledger", response_model=APIResponse[List[dict]])
def get_group_ledger(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Groups", "View"))
):
    from app.models import LedgerEntry
    group_fund = db.query(Fund).filter(Fund.groupId == id).first()
    if not group_fund:
        return APIResponse(success=True, data=[])

    entries = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.fundId == group_fund.id)
        .order_by(LedgerEntry.createdAt.asc())
        .all()
    )

    running_balance = 0
    results = []
    for entry in entries:
        if entry.isCredit:
            running_balance += entry.amount
        else:
            running_balance -= entry.amount

        tx = entry.transaction
        results.append({
            "id": entry.id,
            "date": tx.date.strftime("%Y-%m-%d") if tx and tx.date else "",
            "voucher": tx.id[:8].upper() if tx else "-",
            "type": tx.type if tx else "-",
            "reference": tx.referenceId if (tx and tx.referenceId) else "-",
            "debit": entry.amount if not entry.isCredit else 0,
            "credit": entry.amount if entry.isCredit else 0,
            "runningBalance": running_balance,
            "remarks": tx.notes if (tx and tx.notes) else "-"
        })

    results.reverse()
    return APIResponse(success=True, data=results)

