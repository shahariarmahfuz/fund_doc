from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class FundAllocationItem(BaseModel):
    groupId: str
    amount: int

class LoanCreate(BaseModel):
    beneficiaryId: str
    loanType: str = "OTHER"
    businessType: Optional[str] = None
    amount: int
    purpose: str
    installmentType: Optional[str] = None
    installmentAmount: Optional[int] = None
    totalInstallments: Optional[int] = None
    firstInstallmentDate: Optional[datetime] = None
    notes: Optional[str] = None
    fundAllocations: List[FundAllocationItem]

class LoanUpdate(BaseModel):
    beneficiaryId: Optional[str] = None
    loanType: Optional[str] = None
    businessType: Optional[str] = None
    amount: Optional[int] = None
    purpose: Optional[str] = None
    installmentType: Optional[str] = None
    installmentAmount: Optional[int] = None
    totalInstallments: Optional[int] = None
    firstInstallmentDate: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class LoanRepaymentCreate(BaseModel):
    loanId: str
    amount: int
    date: str
    installmentNo: Optional[int] = None
    paymentMethod: str = "CASH"
    referenceNumber: Optional[str] = None
    notes: Optional[str] = None
    receiptUrl: Optional[str] = None

class LoanRepaymentResponse(BaseSchema):
    id: str
    loanId: str
    ledgerTransactionId: str
    amount: int
    date: datetime
    status: str
    installmentNo: Optional[int] = None
    paymentMethod: str
    referenceNumber: Optional[str] = None
    notes: Optional[str] = None
    collectedBy: Optional[str] = None
    receiptUrl: Optional[str] = None

class FundSimple(BaseSchema):
    id: str
    groupId: Optional[str] = None
    name: str

class FundAllocationResponse(BaseSchema):
    id: str
    fundId: str
    amount: int
    fund: Optional[FundSimple] = None

class LoanBeneficiarySimple(BaseSchema):
    id: str
    beneficiaryId: str
    fullName: str

class LoanDocumentSimple(BaseSchema):
    id: str
    documentNumber: Optional[str] = None
    title: str
    secureUrl: str
    type: str

class LoanResponse(BaseSchema):
    id: str
    loanNumber: str
    memberId: Optional[str] = None
    beneficiaryId: Optional[str] = None
    amount: int
    loanType: str
    businessType: Optional[str] = None
    purpose: str
    requestedDate: datetime
    disbursedDate: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    installmentType: Optional[str] = None
    installmentAmount: Optional[int] = None
    totalInstallments: Optional[int] = None
    firstInstallmentDate: Optional[datetime] = None
    nextDueDate: Optional[datetime] = None
    totalPaidAmount: int = 0
    remainingBalance: int = 0
    createdAt: datetime
    updatedAt: datetime
    repayments: Optional[List[LoanRepaymentResponse]] = []
    allocations: Optional[List[FundAllocationResponse]] = []
    documents: Optional[List[LoanDocumentSimple]] = []
    beneficiary: Optional[LoanBeneficiarySimple] = None
