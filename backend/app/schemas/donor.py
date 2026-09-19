from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema
from app.schemas.member import DocumentSimple

class DonorBase(BaseModel):
    fullName: str
    mobile: Optional[str] = None
    address: Optional[str] = None
    nationalId: Optional[str] = None
    notes: Optional[str] = None
    status: str = "ACTIVE"

class DonorCreate(DonorBase):
    pass

class DonorUpdate(BaseModel):
    fullName: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    nationalId: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class DonorResponse(BaseSchema, DonorBase):
    id: str
    donorId: str
    createdAt: datetime
    updatedAt: datetime
    documents: Optional[List[DocumentSimple]] = []

class ReceiveDonationRequest(BaseModel):
    sourceType: Optional[str] = None  # "MEMBER" | "DONOR"
    memberId: Optional[str] = None
    donorId: Optional[str] = None
    groupId: str
    amount: int
    date: str
    remarks: Optional[str] = None

class DonationTransactionItem(BaseModel):
    id: str
    date: str
    voucherNo: str
    sourceType: str
    donorId: Optional[str] = None
    donor: Optional[dict] = None
    memberId: Optional[str] = None
    member: Optional[dict] = None
    groupId: Optional[str] = None
    groupName: str
    amount: int
    remarks: str
    createdBy: str
    status: str
    createdAt: str
