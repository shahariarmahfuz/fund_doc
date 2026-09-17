from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import json
import re
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.member_request import MemberRequestCreate, MemberRequestResponse, MemberRequestStatusUpdate
from app.models import MemberRequest, Member, Group, Document, MemberStatusHistory
from app.services.member_service import MemberService
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

@router.post("/public/submit", response_model=APIResponse[MemberRequestResponse])
def submit_member_request(
    payload: MemberRequestCreate,
    db: Session = Depends(get_db)
):
    # Validate group if selected
    if payload.groupId:
        group = db.query(Group).filter(Group.id == payload.groupId).first()
        if not group or not group.memberSignupEnabled or group.isFoundationGroup:
            raise APIException("Selected group is not eligible for public member registration.", code="GROUP_SIGNUP_DISABLED")

    now = datetime.now(timezone.utc)
    year = now.year
    prefix = f"MR-{year}-"

    # Find highest sequence
    existing_requests = db.query(MemberRequest.applicationNumber).filter(
        MemberRequest.applicationNumber.startswith(prefix)
    ).all()

    max_num = 0
    for (app_num,) in existing_requests:
        m = re.match(rf"^MR-{year}-(\d+)$", app_num)
        if m:
            val = int(m.group(1))
            if val > max_num:
                max_num = val

    next_num = max_num + 1
    application_number = f"{prefix}{str(next_num).zfill(5)}"

    # Store base64 docs as json string
    docs_payload = []
    if payload.photoBase64:
        docs_payload.append({"title": "Photo", "data": payload.photoBase64[:100] + "..."})
    if payload.nidFrontBase64:
        docs_payload.append({"title": "NID Front", "data": payload.nidFrontBase64[:100] + "..."})
    if payload.nidBackBase64:
        docs_payload.append({"title": "NID Back", "data": payload.nidBackBase64[:100] + "..."})

    req_data = payload.model_dump(exclude={
        "photoBase64", "nidFrontBase64", "nidBackBase64", "birthCertificateBase64", "signatureBase64"
    })

    member_request = MemberRequest(
        applicationNumber=application_number,
        status="PENDING",
        documents=json.dumps(docs_payload) if docs_payload else None,
        **req_data
    )
    db.add(member_request)
    db.commit()
    db.refresh(member_request)
    return APIResponse(success=True, data=member_request)

@router.get("", response_model=APIResponse[List[MemberRequestResponse]])
def get_member_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Members", "View"))
):
    query = db.query(MemberRequest)
    if status:
        query = query.filter(MemberRequest.status == status)
    requests = query.order_by(MemberRequest.submittedAt.desc()).all()
    return APIResponse(success=True, data=requests)

@router.get("/{id}", response_model=APIResponse[MemberRequestResponse])
def get_member_request(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Members", "View"))
):
    request = db.query(MemberRequest).filter(MemberRequest.id == id).first()
    if not request:
        raise NotFoundException("Application request not found.")
    return APIResponse(success=True, data=request)

@router.post("/{id}/approve", response_model=APIResponse[dict])
def approve_member_request(
    id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Members", "Add"))
):
    req = db.query(MemberRequest).filter(MemberRequest.id == id).first()
    if not req:
        raise NotFoundException("Application request not found.")

    if req.status == "APPROVED":
        raise APIException("Application already approved.", code="ALREADY_APPROVED")

    target_group_id = req.groupId
    if not target_group_id:
        foundation_group = db.query(Group).filter(Group.isFoundationGroup.is_(True)).first()
        target_group_id = foundation_group.id if foundation_group else None

    if not target_group_id:
        raise APIException("No valid group available to associate member.", code="NO_GROUP")

    member_id = MemberService.generate_member_id(db)

    # Parse dob if string
    dob_dt = None
    if req.dob:
        try:
            dob_dt = datetime.fromisoformat(req.dob.replace("Z", "+00:00"))
        except Exception:
            pass

    member = Member(
        memberId=member_id,
        groupId=target_group_id,
        fullName=req.fullName,
        fatherName=req.fatherName,
        motherName=req.motherName,
        gender=req.gender,
        dob=dob_dt,
        nationalId=req.nationalId,
        idDocumentType=req.idDocumentType,
        occupation=req.occupation,
        monthlyIncome=req.monthlyIncome,
        bloodGroup=req.bloodGroup,
        education=req.education,
        maritalStatus=req.maritalStatus,
        mobile=req.mobile,
        altMobile=req.altMobile,
        email=req.email,
        phone=req.phone,
        presentAddress=req.presentAddress,
        permanentAddress=req.permanentAddress,
        emergencyContactName=req.emergencyContactName,
        emergencyContactMobile=req.emergencyContactMobile,
        emergencyContactRelation=req.emergencyContactRelation,
        joinDate=datetime.now(timezone.utc),
        status="ACTIVE",
        position="GENERAL_MEMBER",
        reasonForJoining=req.reasonForJoining,
        createdBy=current_user.id
    )
    db.add(member)
    db.flush()

    # Record status history
    db.add(MemberStatusHistory(
        memberId=member.id,
        fromStatus="PENDING_APPLICATION",
        toStatus="ACTIVE",
        reason=f"Approved public application {req.applicationNumber}",
        changedBy=current_user.id
    ))

    # Update request
    req.status = "APPROVED"
    req.approvedAt = datetime.now(timezone.utc)
    req.approvedBy = current_user.id
    req.createdMemberId = member.id

    db.commit()
    return APIResponse(success=True, data={
        "message": "Application approved successfully.",
        "memberId": member.memberId,
        "id": member.id
    })

@router.post("/{id}/status", response_model=APIResponse[MemberRequestResponse])
def update_member_request_status(
    id: str,
    payload: MemberRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Members", "Edit"))
):
    req = db.query(MemberRequest).filter(MemberRequest.id == id).first()
    if not req:
        raise NotFoundException("Application request not found.")

    req.status = payload.status
    if payload.rejectionReason:
        req.rejectionReason = payload.rejectionReason
    if payload.adminMessage:
        req.adminMessage = payload.adminMessage

    db.commit()
    db.refresh(req)
    return APIResponse(success=True, data=req)

@router.get("/by-application/{application_number}", response_model=APIResponse[dict])
def get_member_request_by_app_num(
    application_number: str,
    db: Session = Depends(get_db)
):
    req = db.query(MemberRequest).filter(MemberRequest.applicationNumber == application_number).first()
    if not req:
        raise NotFoundException("Application not found.")
    return APIResponse(success=True, data={
        "id": req.id,
        "applicationNumber": req.applicationNumber,
        "status": req.status,
        "fullName": req.fullName,
        "submittedAt": req.submittedAt.isoformat() if req.submittedAt else None,
        "approvedAt": req.approvedAt.isoformat() if req.approvedAt else None,
        "adminMessage": req.adminMessage,
        "rejectionReason": req.rejectionReason
    })

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_member_request(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Members", "Delete"))
):
    req = db.query(MemberRequest).filter(MemberRequest.id == id).first()
    if not req:
        raise NotFoundException("Application request not found.")
    db.delete(req)
    db.commit()
    return APIResponse(success=True, data={"message": "Application deleted successfully."})

