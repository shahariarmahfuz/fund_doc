from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class ContributionCreate(BaseModel):
    memberId: str
    month: int
    year: int
    amount: int
    paymentDate: str
    paymentMethod: str = "CASH"
    referenceNumber: Optional[str] = None
    notes: Optional[str] = None
    isAdditional: bool = False
    status: str = "PAID"

class ContributionPaymentResponse(BaseSchema):
    id: str
    monthlyContributionId: str
    ledgerTransactionId: str
    amount: int
    paymentDate: datetime
    paymentMethod: str
    referenceNumber: Optional[str] = None
    notes: Optional[str] = None

class MonthlyContributionResponse(BaseSchema):
    id: str
    memberId: str
    month: int
    year: int
    expectedAmount: int
    isAdditional: bool
    status: str
    createdAt: datetime
    updatedAt: datetime
    payments: Optional[List[ContributionPaymentResponse]] = []
