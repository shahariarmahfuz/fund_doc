from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.schemas.common import BaseSchema

class ExpenseNameCreate(BaseModel):
    name: Optional[str] = Field(None, max_length=150, description="Expense name")
    expense_name: Optional[str] = Field(None, max_length=150, description="Expense name alias")
    note: Optional[str] = Field(None, max_length=1000, description="Optional note about this expense")

    @model_validator(mode="after")
    def validate_name(self):
        val = self.name or self.expense_name
        if not val or not val.strip():
            raise ValueError("Expense Name is required.")
        self.name = val.strip()
        return self

class ExpenseNameUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    note: Optional[str] = Field(None, max_length=1000)
    isActive: Optional[bool] = None

class ExpenseNameResponse(BaseSchema):
    id: str
    name: str
    note: Optional[str] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[str] = None


class ExpenseCreate(BaseModel):
    groupId: str = Field(..., min_length=1, description="ID of the funding Group")
    expenseNameId: Optional[str] = None
    customName: Optional[str] = None
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Monetary amount spent, must be > 0")
    comment: Optional[str] = Field(None, max_length=500)
    expenseDate: str = Field(..., description="ISO 8601 date string for expense date")

    @model_validator(mode="after")
    def validate_name_present(self):
        has_id = bool(self.expenseNameId and self.expenseNameId.strip())
        has_custom = bool(self.customName and self.customName.strip())
        if not has_id and not has_custom:
            raise ValueError("Either an existing Expense Name or a custom Expense Name must be provided.")
        return self

class ExpenseUpdate(BaseModel):
    groupId: Optional[str] = None
    expenseNameId: Optional[str] = None
    customName: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    comment: Optional[str] = Field(None, max_length=500)
    expenseDate: Optional[str] = None

class ExpenseResponse(BaseSchema):
    id: str
    expenseId: Optional[str] = None
    groupId: str
    groupName: Optional[str] = None
    expenseNameId: Optional[str] = None
    customName: Optional[str] = None
    resolvedExpenseName: str
    amount: Decimal
    comment: Optional[str] = None
    note: Optional[str] = None
    expenseDate: datetime
    isDeleted: bool
    ledgerTransactionId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[str] = None
    creatorName: Optional[str] = None
    expenseName: Optional[ExpenseNameResponse] = None

class ExpensePaginationResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int
    totalAmount: Decimal

class ExpenseReportCategoryBreakdown(BaseModel):
    name: str
    amount: Decimal
    count: int
    percentage: float

class ExpenseReportGroupBreakdown(BaseModel):
    groupId: str
    groupName: str
    amount: Decimal
    count: int
    percentage: float

class ExpenseReportDateBreakdown(BaseModel):
    date: str
    amount: Decimal
    count: int

class ExpenseReportResponse(BaseModel):
    items: List[ExpenseResponse] = []
    totalAmount: Decimal
    totalCount: int
    breakdown: List[ExpenseReportCategoryBreakdown] = []
    groupBreakdown: List[ExpenseReportGroupBreakdown] = []
    dateBreakdown: List[ExpenseReportDateBreakdown] = []
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    groupId: Optional[str] = None
    expenseNameId: Optional[str] = None

class ExpenseLedgerItem(BaseModel):
    id: str
    date: datetime
    groupId: str
    groupName: str
    expenseName: str
    comment: Optional[str] = None
    debit: Decimal
    createdAt: datetime
    createdBy: Optional[str] = None
    creatorName: Optional[str] = None

class ExpenseLedgerResponse(BaseModel):
    items: List[ExpenseLedgerItem]
    totalAmount: Decimal
    total: int
    page: int
    pageSize: int
    totalPages: int
