from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.cache import app_cache
from app.schemas.common import APIResponse
from app.schemas.expense import (
    ExpenseNameCreate,
    ExpenseNameUpdate,
    ExpenseNameResponse,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpensePaginationResponse,
    ExpenseReportResponse,
    ExpenseLedgerResponse,
)
from app.services.expense_service import ExpenseService
from app.dependencies.permissions import require_permission

router = APIRouter()

# --- Expense Names (Categories) ---

@router.get("/expense-names", response_model=APIResponse[List[ExpenseNameResponse]])
def get_expense_names(
    active_only: bool = Query(False, description="Filter only active expense names"),
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Expenses", "View"))
):
    cache_key = f"expense_names_{active_only}"
    cached = app_cache.get(cache_key)
    if cached is not None:
        return APIResponse(success=True, data=cached)
    names = ExpenseService.list_expense_names(db, active_only=active_only)
    app_cache.set(cache_key, names, ttl=300, tags=["expense_names"])
    return APIResponse(success=True, data=names)

@router.post("/expense-names", response_model=APIResponse[ExpenseNameResponse])
def create_expense_name(
    payload: ExpenseNameCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Expenses", "Add"))
):
    created = ExpenseService.create_expense_name(db, payload, current_user_id=current_user.id)
    app_cache.invalidate_tag("expense_names")
    return APIResponse(success=True, data=created)

@router.patch("/expense-names/{id}", response_model=APIResponse[ExpenseNameResponse])
def update_expense_name(
    id: str,
    payload: ExpenseNameUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Expenses", "Edit"))
):
    updated = ExpenseService.update_expense_name(db, id, payload, current_user_id=current_user.id)
    app_cache.invalidate_tag("expense_names")
    return APIResponse(success=True, data=updated)

@router.delete("/expense-names/{id}", response_model=APIResponse[dict])
def delete_expense_name(
    id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Expenses", "Delete"))
):
    ExpenseService.delete_expense_name(db, id, current_user_id=current_user.id)
    app_cache.invalidate_tag("expense_names")
    return APIResponse(success=True, data={"message": "Expense name deleted successfully."})

# --- Expenses ---

@router.get("/expenses", response_model=APIResponse[ExpensePaginationResponse])
def list_expenses(
    search: Optional[str] = Query(None, description="Search custom name, category, or comment"),
    group_id: Optional[str] = Query(None, description="Filter by funding Group ID"),
    expense_name_id: Optional[str] = Query(None, description="Filter by expense name ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("expenseDate"),
    sort_desc: bool = Query(True),
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Expenses", "View"))
):
    res = ExpenseService.list_expenses(
        db=db,
        search=search,
        group_id=group_id,
        expense_name_id=expense_name_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_desc=sort_desc
    )
    return APIResponse(success=True, data=res)

@router.post("/expenses", response_model=APIResponse[ExpenseResponse])
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Expenses", "Add"))
):
    created = ExpenseService.create_expense(db, payload, current_user_id=current_user.id)
    app_cache.invalidate_tag("dashboard")
    app_cache.invalidate_tag("groups")
    return APIResponse(success=True, data=created)

@router.get("/expenses/report", response_model=APIResponse[ExpenseReportResponse])
def get_expense_report(
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    from_date: Optional[str] = Query(None, description="Start date filter alias"),
    to_date: Optional[str] = Query(None, description="End date filter alias"),
    group_id: Optional[str] = Query(None, description="Filter by funding Group ID"),
    expense_name_id: Optional[str] = Query(None, description="Filter by expense name ID"),
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Expenses", "View"))
):
    effective_start = from_date or start_date
    effective_end = to_date or end_date
    report = ExpenseService.get_report(
        db=db,
        start_date=effective_start,
        end_date=effective_end,
        group_id=group_id,
        expense_name_id=expense_name_id
    )
    return APIResponse(success=True, data=report)

@router.get("/expenses/ledger", response_model=APIResponse[ExpenseLedgerResponse])
def get_expense_ledger(
    start_date: Optional[str] = Query(None, description="Start date filter"),
    end_date: Optional[str] = Query(None, description="End date filter"),
    group_id: Optional[str] = Query(None, description="Filter by funding Group ID"),
    expense_name_id: Optional[str] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Expenses", "View"))
):
    ledger = ExpenseService.get_ledger(
        db=db,
        start_date=start_date,
        end_date=end_date,
        group_id=group_id,
        expense_name_id=expense_name_id,
        search=search,
        page=page,
        page_size=page_size
    )
    return APIResponse(success=True, data=ledger)

@router.get("/expenses/{id}", response_model=APIResponse[ExpenseResponse])
def get_expense(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Expenses", "View"))
):
    expense = ExpenseService.get_expense_by_id(db, id)
    return APIResponse(success=True, data=expense)

@router.patch("/expenses/{id}", response_model=APIResponse[ExpenseResponse])
def update_expense(
    id: str,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Expenses", "Edit"))
):
    updated = ExpenseService.update_expense(db, id, payload, current_user_id=current_user.id)
    app_cache.invalidate_tag("dashboard")
    app_cache.invalidate_tag("groups")
    return APIResponse(success=True, data=updated)

@router.delete("/expenses/{id}", response_model=APIResponse[dict])
def delete_expense(
    id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Expenses", "Delete"))
):
    ExpenseService.soft_delete_expense(db, id, current_user_id=current_user.id)
    app_cache.invalidate_tag("dashboard")
    app_cache.invalidate_tag("groups")
    return APIResponse(success=True, data={"message": "Expense record deleted successfully."})
