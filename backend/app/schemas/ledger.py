from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class LedgerEntryInput(BaseModel):
    fundId: str
    isCredit: bool
    amount: int

class LedgerTransactionCreate(BaseModel):
    date: datetime
    type: str
    referenceId: Optional[str] = None
    memberId: Optional[str] = None
    donorId: Optional[str] = None
    notes: Optional[str] = None
    entries: List[LedgerEntryInput]

class LedgerRowItem(BaseModel):
    id: str
    date: datetime
    reference: str
    description: str
    deposit: int
    withdrawal: int
    type: str

class GeneralLedgerItem(BaseModel):
    id: str
    date: datetime
    type: str
    referenceId: Optional[str] = None
    fund: str
    group: str
    debit: int
    credit: int
    notes: Optional[str] = None

class FoundationSummaryItem(BaseModel):
    id: str
    fundName: str
    groupName: str
    type: str
    balance: float
