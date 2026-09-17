from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class MemberRequestCreate(BaseModel):
    fullName: str
    fatherName: Optional[str] = None
    motherName: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    nationalId: Optional[str] = None
    idDocumentType: Optional[str] = "NID"
    occupation: Optional[str] = None
    monthlyIncome: Optional[int] = None
    bloodGroup: Optional[str] = None
    education: Optional[str] = None
    maritalStatus: Optional[str] = None
    mobile: Optional[str] = None
    altMobile: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    presentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactMobile: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    referenceName: Optional[str] = None
    referenceMobile: Optional[str] = None
    referenceRelation: Optional[str] = None
    groupId: Optional[str] = None
    reasonForJoining: Optional[str] = None

    # Base64 documents for public submission
    photoBase64: Optional[str] = None
    nidFrontBase64: Optional[str] = None
    nidBackBase64: Optional[str] = None
    birthCertificateBase64: Optional[str] = None
    signatureBase64: Optional[str] = None

class MemberRequestStatusUpdate(BaseModel):
    status: str  # "APPROVED" | "REJECTED" | "NEEDS_CHANGES"
    rejectionReason: Optional[str] = None
    adminMessage: Optional[str] = None

class MemberRequestResponse(BaseSchema):
    id: str
    applicationNumber: str
    status: str
    fullName: str
    fatherName: Optional[str] = None
    motherName: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    nationalId: Optional[str] = None
    idDocumentType: Optional[str] = "NID"
    occupation: Optional[str] = None
    monthlyIncome: Optional[int] = None
    bloodGroup: Optional[str] = None
    education: Optional[str] = None
    maritalStatus: Optional[str] = None
    mobile: Optional[str] = None
    altMobile: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    presentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactMobile: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    referenceName: Optional[str] = None
    referenceMobile: Optional[str] = None
    referenceRelation: Optional[str] = None
    groupId: Optional[str] = None
    reasonForJoining: Optional[str] = None
    documents: Optional[str] = None
    rejectionReason: Optional[str] = None
    adminMessage: Optional[str] = None
    approvedAt: Optional[datetime] = None
    approvedBy: Optional[str] = None
    createdMemberId: Optional[str] = None
    submittedAt: datetime
    updatedAt: datetime
