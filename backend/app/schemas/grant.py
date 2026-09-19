from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema
from app.schemas.loan import FundAllocationItem, FundAllocationResponse

class GrantCreate(BaseModel):
    beneficiaryId: str
    amount: int
    grantReason: str
    grantDate: str
    comment: Optional[str] = None
    allocations: List[FundAllocationItem]

class GrantUpdate(BaseModel):
    beneficiaryId: Optional[str] = None
    amount: Optional[int] = None
    grantReason: Optional[str] = None
    grantDate: Optional[str] = None
    comment: Optional[str] = None
    status: Optional[str] = None

class BeneficiarySimple(BaseSchema):
    id: str
    beneficiaryId: str
    fullName: str

class GrantResponse(BaseSchema):
    id: str
    grantNumber: str
    beneficiaryId: str
    amount: int
    purpose: str
    dateApproved: Optional[datetime] = None
    disbursedDate: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    beneficiary: Optional[BeneficiarySimple] = None
    allocations: Optional[List[FundAllocationResponse]] = []
