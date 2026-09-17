from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class MemberBase(BaseModel):
    fullName: Optional[str] = None
    groupId: str
    fatherName: Optional[str] = None
    motherName: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[datetime] = None
    nationalId: Optional[str] = None
    idDocumentType: Optional[str] = "NID"
    occupation: Optional[str] = None
    monthlyIncome: Optional[int] = None
    bloodGroup: Optional[str] = None
    mobile: Optional[str] = None
    altMobile: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    presentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactMobile: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    joinDate: Optional[datetime] = None
    status: str = "ACTIVE"
    position: Optional[str] = "GENERAL_MEMBER"
    remarks: Optional[str] = None
    maritalStatus: Optional[str] = None
    education: Optional[str] = None
    workplace: Optional[str] = None
    designation: Optional[str] = None
    skills: Optional[str] = None
    reference: Optional[str] = None
    reasonForJoining: Optional[str] = None
    participation: Optional[str] = None
    declarationAccepted: bool = True
    memberType: Optional[str] = "REGULAR"

class MemberCreate(MemberBase):
    memberId: Optional[str] = None
    photoBase64: Optional[str] = None
    nidFrontBase64: Optional[str] = None
    nidBackBase64: Optional[str] = None

class MemberUpdate(BaseModel):
    fullName: Optional[str] = None
    groupId: Optional[str] = None
    fatherName: Optional[str] = None
    motherName: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[datetime] = None
    nationalId: Optional[str] = None
    idDocumentType: Optional[str] = None
    occupation: Optional[str] = None
    monthlyIncome: Optional[int] = None
    bloodGroup: Optional[str] = None
    mobile: Optional[str] = None
    altMobile: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    presentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactMobile: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    joinDate: Optional[datetime] = None
    status: Optional[str] = None
    position: Optional[str] = None
    remarks: Optional[str] = None
    maritalStatus: Optional[str] = None
    education: Optional[str] = None
    workplace: Optional[str] = None
    designation: Optional[str] = None
    skills: Optional[str] = None
    reference: Optional[str] = None
    reasonForJoining: Optional[str] = None
    participation: Optional[str] = None
    declarationAccepted: Optional[bool] = None
    memberType: Optional[str] = None
    photoBase64: Optional[str] = None
    nidFrontBase64: Optional[str] = None
    nidBackBase64: Optional[str] = None

class GroupSimple(BaseSchema):
    id: str
    name: str
    code: str

class DocumentSimple(BaseSchema):
    id: str
    title: str
    secureUrl: str
    type: str

class MemberResponse(BaseSchema, MemberBase):
    id: str
    memberId: str
    paidUntilMonth: Optional[int] = None
    paidUntilYear: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime
    group: Optional[GroupSimple] = None
    documents: Optional[List[DocumentSimple]] = []

class MemberDueItem(BaseModel):
    id: str
    memberId: str
    fullName: str
    mobile: Optional[str] = None
    groupId: str
    groupName: str
    monthlyFee: int
    lastCollectionDate: Optional[str] = None
    paidUntilMonth: Optional[int] = None
    paidUntilYear: Optional[int] = None
    paidUntil: Optional[str] = None
    monthsOverdue: int = 0
    currentDue: int = 0
    advanceBalance: int = 0
    status: str = "ACTIVE"
