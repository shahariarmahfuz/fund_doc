from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema
from app.schemas.member import DocumentSimple

class BeneficiaryBase(BaseModel):
    fullName: str
    memberId: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    presentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    nationalId: Optional[str] = None
    idDocumentType: Optional[str] = "NID"
    fatherOrHusbandName: Optional[str] = None
    beneficiaryPhoto: Optional[str] = None
    nidOrBirthCertificate: Optional[str] = None
    occupation: Optional[str] = None
    remarks: Optional[str] = None
    relationToMember: Optional[str] = None
    assistanceType: Optional[str] = None
    assistanceReason: Optional[str] = None
    loanReason: Optional[str] = None
    businessType: Optional[str] = None
    loanPurpose: Optional[str] = None
    loanAmount: Optional[int] = None
    emergencyContactName: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    emergencyContactMobile: Optional[str] = None
    status: str = "ACTIVE"

class BeneficiaryCreate(BeneficiaryBase):
    pass

class BeneficiaryUpdate(BaseModel):
    fullName: Optional[str] = None
    memberId: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    presentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    nationalId: Optional[str] = None
    idDocumentType: Optional[str] = None
    fatherOrHusbandName: Optional[str] = None
    beneficiaryPhoto: Optional[str] = None
    nidOrBirthCertificate: Optional[str] = None
    occupation: Optional[str] = None
    remarks: Optional[str] = None
    relationToMember: Optional[str] = None
    assistanceType: Optional[str] = None
    assistanceReason: Optional[str] = None
    loanReason: Optional[str] = None
    businessType: Optional[str] = None
    loanPurpose: Optional[str] = None
    loanAmount: Optional[int] = None
    emergencyContactName: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    emergencyContactMobile: Optional[str] = None
    status: Optional[str] = None

class MemberMinimal(BaseSchema):
    id: str
    memberId: str
    fullName: Optional[str] = None

class CampaignMinimal(BaseSchema):
    id: str
    name: str

class BeneficiaryPaymentSimple(BaseSchema):
    id: str
    amount: int
    date: datetime
    reason: Optional[str] = None
    campaignId: str
    campaign: Optional[CampaignMinimal] = None

class BeneficiaryResponse(BaseSchema, BeneficiaryBase):
    id: str
    beneficiaryId: str
    createdAt: datetime
    updatedAt: datetime
    member: Optional[MemberMinimal] = None
    documents: Optional[List[DocumentSimple]] = []
    beneficiaryPayments: Optional[List[BeneficiaryPaymentSimple]] = []
