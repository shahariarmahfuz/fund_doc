from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import Expense, ExpenseName, AuditLog, User, Group, Fund, LedgerTransaction, LedgerEntry
from app.repositories.expense_repository import ExpenseRepository
from app.services.ledger_engine import LedgerEngine
from app.services.finance_service import FinancialService
from app.schemas.ledger import LedgerEntryInput
from app.schemas.expense import (
    ExpenseNameCreate,
    ExpenseNameUpdate,
    ExpenseNameResponse,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpensePaginationResponse,
    ExpenseReportResponse,
    ExpenseReportCategoryBreakdown,
    ExpenseReportGroupBreakdown,
    ExpenseReportDateBreakdown,
    ExpenseLedgerItem,
    ExpenseLedgerResponse,
)
from app.core.exceptions import APIException, NotFoundException

def parse_iso_datetime(date_str: str, is_end_of_day: bool = False) -> datetime:
    try:
        clean_str = date_str.replace("Z", "+00:00")
        if len(clean_str) == 10:  # YYYY-MM-DD
            dt = datetime.fromisoformat(clean_str)
            if is_end_of_day:
                dt = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            return dt.replace(tzinfo=timezone.utc)
        return datetime.fromisoformat(clean_str)
    except Exception:
        raise APIException("Invalid date format. Expected ISO-8601 string (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ).", code="INVALID_DATE_FORMAT", status_code=400)

class ExpenseService:
    @staticmethod
    def get_user_name_map(db: Session, user_ids: List[str]) -> Dict[str, str]:
        unique_ids = [uid for uid in set(user_ids) if uid]
        if not unique_ids:
            return {}
        users = db.query(User.id, User.name).filter(User.id.in_(unique_ids)).all()
        return {u[0]: u[1] for u in users}

    @staticmethod
    def list_expense_names(db: Session, active_only: bool = False) -> List[ExpenseNameResponse]:
        names = ExpenseRepository.list_names(db, active_only=active_only)
        return [ExpenseNameResponse.model_validate(n) for n in names]

    @staticmethod
    def create_expense_name(db: Session, payload: ExpenseNameCreate, current_user_id: Optional[str] = None) -> ExpenseNameResponse:
        name = (payload.name or payload.expense_name or "").strip()
        if not name:
            raise APIException("Expense name cannot be empty.", code="INVALID_NAME", status_code=400)

        existing = ExpenseRepository.get_name_by_name(db, name)
        if existing:
            raise APIException(f"An expense name '{existing.name}' already exists.", code="DUPLICATE_EXPENSE_NAME", status_code=400)

        created = ExpenseRepository.create_name(db, name=name, note=payload.note, user_id=current_user_id)

        db.add(AuditLog(
            action="CREATE",
            module="Expenses",
            remarks=f"Created expense name: {name}",
            userId=current_user_id,
            referenceId=created.id
        ))
        db.commit()

        return ExpenseNameResponse.model_validate(created)

    @staticmethod
    def update_expense_name(db: Session, id: str, payload: ExpenseNameUpdate, current_user_id: Optional[str] = None) -> ExpenseNameResponse:
        expense_name = ExpenseRepository.get_name_by_id(db, id)
        if not expense_name:
            raise NotFoundException("Expense name not found.")

        if payload.name is not None:
            clean_name = payload.name.strip()
            if not clean_name:
                raise APIException("Expense name cannot be empty.", code="INVALID_NAME", status_code=400)
            existing = ExpenseRepository.get_name_by_name(db, clean_name)
            if existing and existing.id != id:
                raise APIException(f"An expense name '{existing.name}' already exists.", code="DUPLICATE_EXPENSE_NAME", status_code=400)

        updated = ExpenseRepository.update_name(
            db,
            expense_name=expense_name,
            name=payload.name,
            note=payload.note,
            is_active=payload.isActive,
            user_id=current_user_id
        )

        db.add(AuditLog(
            action="UPDATE",
            module="Expenses",
            remarks=f"Updated expense name: {updated.name} (Active: {updated.isActive})",
            userId=current_user_id,
            referenceId=updated.id
        ))
        db.commit()

        return ExpenseNameResponse.model_validate(updated)

    @staticmethod
    def delete_expense_name(db: Session, id: str, current_user_id: Optional[str] = None) -> None:
        expense_name = ExpenseRepository.get_name_by_id(db, id)
        if not expense_name:
            raise NotFoundException("Expense name not found.")

        referenced_count = db.query(Expense).filter(Expense.expenseNameId == id, Expense.isDeleted.is_(False)).count()
        if referenced_count > 0:
            raise APIException(
                f"Cannot delete '{expense_name.name}' because it is linked to {referenced_count} active expense transaction(s). Deactivate it instead.",
                code="EXPENSE_NAME_IN_USE",
                status_code=400
            )

        name_str = expense_name.name
        ExpenseRepository.delete_name(db, expense_name)

        db.add(AuditLog(
            action="DELETE",
            module="Expenses",
            remarks=f"Deleted expense name: {name_str}",
            userId=current_user_id,
            referenceId=id
        ))
        db.commit()

    @staticmethod
    def get_expense_by_id(db: Session, id: str) -> ExpenseResponse:
        expense = ExpenseRepository.get_expense_by_id(db, id)
        if not expense:
            raise NotFoundException("Expense not found.")

        creator_name = None
        if expense.createdBy:
            u = db.query(User.name).filter(User.id == expense.createdBy).first()
            if u:
                creator_name = u[0]

        resolved_name = expense.expenseName.name if expense.expenseName else (expense.customName or "Unnamed Expense")
        group_name = expense.group.name if expense.group else None
        exp_id = getattr(expense, "expenseId", None) or f"EXP-{expense.id[:6].upper()}"

        return ExpenseResponse(
            id=expense.id,
            expenseId=exp_id,
            groupId=expense.groupId,
            groupName=group_name,
            expenseNameId=expense.expenseNameId,
            customName=expense.customName,
            resolvedExpenseName=resolved_name,
            amount=expense.amount,
            comment=expense.comment,
            note=expense.comment,
            expenseDate=expense.expenseDate,
            isDeleted=expense.isDeleted,
            ledgerTransactionId=expense.ledgerTransactionId,
            createdAt=expense.createdAt,
            updatedAt=expense.updatedAt,
            createdBy=expense.createdBy,
            creatorName=creator_name,
            expenseName=ExpenseNameResponse.model_validate(expense.expenseName) if expense.expenseName else None
        )

    @staticmethod
    def create_expense(db: Session, payload: ExpenseCreate, current_user_id: Optional[str] = None) -> ExpenseResponse:
        if payload.amount <= 0:
            raise APIException("Amount must be greater than 0.", code="INVALID_AMOUNT", status_code=400)

        if not payload.groupId or not payload.groupId.strip():
            raise APIException("A funding Group must be selected for every expense.", code="MISSING_GROUP", status_code=400)

        group = db.query(Group).filter(Group.id == payload.groupId.strip()).first()
        if not group:
            raise NotFoundException("Selected Group does not exist.")

        has_name_id = bool(payload.expenseNameId and payload.expenseNameId.strip())
        has_custom = bool(payload.customName and payload.customName.strip())

        if not has_name_id and not has_custom:
            raise APIException("Either an existing Expense Name or a custom Expense Name must be provided.", code="MISSING_EXPENSE_NAME", status_code=400)

        if has_name_id:
            exp_name = ExpenseRepository.get_name_by_id(db, payload.expenseNameId.strip())
            if not exp_name:
                raise NotFoundException("Selected Expense Name does not exist.")

        dt = parse_iso_datetime(payload.expenseDate)

        # -------------------------------------------------------------
        # ATOMIC CONCURRENCY CHECK & FUND LOCKING
        # -------------------------------------------------------------
        group_fund, general_fund = LedgerEngine.get_or_create_funds(db, group.id)
        # Lock the group fund row to prevent concurrent overspending
        db.query(Fund).filter(Fund.id == group_fund.id).with_for_update().first()

        # Query authoritative available balance for this group
        summary = FinancialService.get_group_fund_summary(db, group.id)
        current_balance = Decimal(str(summary.get("currentBalance", 0)))

        if current_balance < payload.amount:
            raise APIException(
                f"Insufficient group balance in '{group.name}'. Available: ৳{current_balance:,.2f}, Required: ৳{payload.amount:,.2f}",
                code="INSUFFICIENT_FUNDS",
                status_code=400
            )

        total_count = db.query(Expense).count() + 1
        expense_id_str = f"EXP-{total_count:04d}"

        # Create expense record
        created = ExpenseRepository.create_expense(
            db=db,
            group_id=group.id,
            expense_name_id=payload.expenseNameId.strip() if has_name_id else None,
            custom_name=payload.customName.strip() if has_custom else None,
            amount=payload.amount,
            comment=payload.comment,
            expense_date=dt,
            expense_id=expense_id_str,
            user_id=current_user_id
        )

        resolved_name = created.expenseName.name if created.expenseName else (created.customName or "Unnamed Expense")

        # Double-entry ledger transaction:
        # Debit Group Fund (decrease Group Equity/Asset allocation)
        # Credit General Fund (decrease Cash Asset)
        amount_int = int(payload.amount)
        ledger_entries = [
            LedgerEntryInput(fundId=group_fund.id, isCredit=False, amount=amount_int),
            LedgerEntryInput(fundId=general_fund.id, isCredit=True, amount=amount_int)
        ]

        tx = LedgerEngine.create_transaction(
            db=db,
            date=dt,
            type="EXPENSE",
            entries=ledger_entries,
            reference_id=expense_id_str,
            notes=f"Expense ({resolved_name}) - Group: {group.name}{f': {payload.comment}' if payload.comment else ''}",
            created_by=current_user_id
        )

        created.ledgerTransactionId = tx.id

        db.add(AuditLog(
            action="CREATE",
            module="Expenses",
            remarks=f"Recorded expense of ৳{payload.amount:.2f} for '{resolved_name}' paid from Group '{group.name}'",
            userId=current_user_id,
            referenceId=created.id
        ))

        db.commit()
        db.refresh(created)

        creator_name = None
        if current_user_id:
            u = db.query(User.name).filter(User.id == current_user_id).first()
            if u:
                creator_name = u[0]

        return ExpenseResponse(
            id=created.id,
            expenseId=created.expenseId or f"EXP-{created.id[:6].upper()}",
            groupId=created.groupId,
            groupName=group.name,
            expenseNameId=created.expenseNameId,
            customName=created.customName,
            resolvedExpenseName=resolved_name,
            amount=created.amount,
            comment=created.comment,
            note=created.comment,
            expenseDate=created.expenseDate,
            isDeleted=created.isDeleted,
            ledgerTransactionId=created.ledgerTransactionId,
            createdAt=created.createdAt,
            updatedAt=created.updatedAt,
            createdBy=created.createdBy,
            creatorName=creator_name,
            expenseName=ExpenseNameResponse.model_validate(created.expenseName) if created.expenseName else None
        )

    @staticmethod
    def update_expense(db: Session, id: str, payload: ExpenseUpdate, current_user_id: Optional[str] = None) -> ExpenseResponse:
        expense = ExpenseRepository.get_expense_by_id(db, id)
        if not expense:
            raise NotFoundException("Expense not found.")

        if payload.amount is not None and payload.amount <= 0:
            raise APIException("Amount must be greater than 0.", code="INVALID_AMOUNT", status_code=400)

        target_group_id = payload.groupId.strip() if (payload.groupId and payload.groupId.strip()) else expense.groupId
        target_group = db.query(Group).filter(Group.id == target_group_id).first()
        if not target_group:
            raise NotFoundException("Target Group not found.")

        target_amount = payload.amount if payload.amount is not None else expense.amount

        expense_name_id = expense.expenseNameId
        custom_name = expense.customName

        if payload.expenseNameId is not None:
            if payload.expenseNameId.strip():
                exp_name = ExpenseRepository.get_name_by_id(db, payload.expenseNameId.strip())
                if not exp_name:
                    raise NotFoundException("Selected Expense Name does not exist.")
                expense_name_id = payload.expenseNameId.strip()
            else:
                expense_name_id = None

        if payload.customName is not None:
            custom_name = payload.customName.strip() if payload.customName.strip() else None

        if not expense_name_id and not custom_name:
            raise APIException("Either an existing Expense Name or a custom Expense Name must be provided.", code="MISSING_EXPENSE_NAME", status_code=400)

        dt = parse_iso_datetime(payload.expenseDate) if payload.expenseDate else expense.expenseDate

        # -------------------------------------------------------------
        # ATOMIC FINANCIAL REVERSAL & APPLICATION
        # -------------------------------------------------------------
        # Lock old and new group funds
        old_group_fund, old_general_fund = LedgerEngine.get_or_create_funds(db, expense.groupId)
        db.query(Fund).filter(Fund.id == old_group_fund.id).with_for_update().first()

        if target_group_id != expense.groupId:
            new_group_fund, new_general_fund = LedgerEngine.get_or_create_funds(db, target_group_id)
            db.query(Fund).filter(Fund.id == new_group_fund.id).with_for_update().first()
        else:
            new_group_fund = old_group_fund
            new_general_fund = old_general_fund

        # 1. Reverse old ledger transaction if present
        if expense.ledgerTransactionId:
            db.query(LedgerEntry).filter(LedgerEntry.transactionId == expense.ledgerTransactionId).delete()
            db.query(LedgerTransaction).filter(LedgerTransaction.id == expense.ledgerTransactionId).delete()
            db.flush()

        # 2. Check available balance on target group
        summary = FinancialService.get_group_fund_summary(db, target_group_id)
        current_balance = Decimal(str(summary.get("currentBalance", 0)))

        if current_balance < target_amount:
            # Rollback to preserve original state
            db.rollback()
            raise APIException(
                f"Insufficient group balance in '{target_group.name}'. Available: ৳{current_balance:,.2f}, Required: ৳{target_amount:,.2f}",
                code="INSUFFICIENT_FUNDS",
                status_code=400
            )

        # 3. Create new balanced ledger transaction
        resolved_name = (
            db.query(ExpenseName.name).filter(ExpenseName.id == expense_name_id).scalar()
            if expense_name_id
            else (custom_name or "Unnamed Expense")
        )

        amount_int = int(target_amount)
        ledger_entries = [
            LedgerEntryInput(fundId=new_group_fund.id, isCredit=False, amount=amount_int),
            LedgerEntryInput(fundId=new_general_fund.id, isCredit=True, amount=amount_int)
        ]

        new_tx = LedgerEngine.create_transaction(
            db=db,
            date=dt,
            type="EXPENSE",
            entries=ledger_entries,
            reference_id=f"EXP-{expense.id[:8].upper()}",
            notes=f"Expense ({resolved_name}) - Group: {target_group.name}{f': {payload.comment or expense.comment}' if (payload.comment or expense.comment) else ''}",
            created_by=current_user_id
        )

        # 4. Update expense record
        updated = ExpenseRepository.update_expense(
            db=db,
            expense=expense,
            group_id=target_group_id,
            expense_name_id=expense_name_id,
            custom_name=custom_name,
            amount=target_amount,
            comment=payload.comment,
            expense_date=dt,
            ledger_transaction_id=new_tx.id,
            user_id=current_user_id
        )

        db.add(AuditLog(
            action="UPDATE",
            module="Expenses",
            remarks=f"Updated expense record: {resolved_name} (Group: {target_group.name}, Amount: ৳{updated.amount:.2f})",
            userId=current_user_id,
            referenceId=updated.id
        ))

        db.commit()
        db.refresh(updated)

        creator_name = None
        if updated.createdBy:
            u = db.query(User.name).filter(User.id == updated.createdBy).first()
            if u:
                creator_name = u[0]

        return ExpenseResponse(
            id=updated.id,
            expenseId=getattr(updated, "expenseId", None) or f"EXP-{updated.id[:6].upper()}",
            groupId=updated.groupId,
            groupName=target_group.name,
            expenseNameId=updated.expenseNameId,
            customName=updated.customName,
            resolvedExpenseName=resolved_name,
            amount=updated.amount,
            comment=updated.comment,
            note=updated.comment,
            expenseDate=updated.expenseDate,
            isDeleted=updated.isDeleted,
            ledgerTransactionId=updated.ledgerTransactionId,
            createdAt=updated.createdAt,
            updatedAt=updated.updatedAt,
            createdBy=updated.createdBy,
            creatorName=creator_name,
            expenseName=ExpenseNameResponse.model_validate(updated.expenseName) if updated.expenseName else None
        )

    @staticmethod
    def soft_delete_expense(db: Session, id: str, current_user_id: Optional[str] = None) -> bool:
        expense = ExpenseRepository.get_expense_by_id(db, id)
        if not expense:
            raise NotFoundException("Expense not found.")

        resolved_name = expense.expenseName.name if expense.expenseName else (expense.customName or "Unnamed Expense")
        group_name = expense.group.name if expense.group else "Unknown Group"

        # Lock group fund
        if expense.groupId:
            group_fund, _ = LedgerEngine.get_or_create_funds(db, expense.groupId)
            db.query(Fund).filter(Fund.id == group_fund.id).with_for_update().first()

        # Reverse/remove ledger transaction entries, restoring the group balance
        if expense.ledgerTransactionId:
            db.query(LedgerEntry).filter(LedgerEntry.transactionId == expense.ledgerTransactionId).delete()
            db.query(LedgerTransaction).filter(LedgerTransaction.id == expense.ledgerTransactionId).delete()
            expense.ledgerTransactionId = None

        ExpenseRepository.soft_delete_expense(db, expense, user_id=current_user_id)

        db.add(AuditLog(
            action="DELETE",
            module="Expenses",
            remarks=f"Soft-deleted expense of ৳{expense.amount:.2f} for '{resolved_name}' (Fund restored to Group '{group_name}')",
            userId=current_user_id,
            referenceId=expense.id
        ))

        db.commit()
        return True

    @staticmethod
    def list_expenses(
        db: Session,
        search: Optional[str] = None,
        group_id: Optional[str] = None,
        expense_name_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
        sort_by: str = "expenseDate",
        sort_desc: bool = True
    ) -> ExpensePaginationResponse:
        s_dt = parse_iso_datetime(start_date) if start_date else None
        e_dt = parse_iso_datetime(end_date) if end_date else None

        items, total, total_amount = ExpenseRepository.list_expenses(
            db=db,
            search=search,
            group_id=group_id,
            expense_name_id=expense_name_id,
            start_date=s_dt,
            end_date=e_dt,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_desc=sort_desc
        )

        user_ids = [item.createdBy for item in items if item.createdBy]
        user_map = ExpenseService.get_user_name_map(db, user_ids)

        res_items = []
        for item in items:
            resolved_name = item.expenseName.name if item.expenseName else (item.customName or "Unnamed Expense")
            exp_id = getattr(item, "expenseId", None) or f"EXP-{item.id[:6].upper()}"
            res_items.append(
                ExpenseResponse(
                    id=item.id,
                    expenseId=exp_id,
                    groupId=item.groupId,
                    groupName=item.group.name if item.group else None,
                    expenseNameId=item.expenseNameId,
                    customName=item.customName,
                    resolvedExpenseName=resolved_name,
                    amount=item.amount,
                    comment=item.comment,
                    note=item.comment,
                    expenseDate=item.expenseDate,
                    isDeleted=item.isDeleted,
                    ledgerTransactionId=item.ledgerTransactionId,
                    createdAt=item.createdAt,
                    updatedAt=item.updatedAt,
                    createdBy=item.createdBy,
                    creatorName=user_map.get(item.createdBy) if item.createdBy else None,
                    expenseName=ExpenseNameResponse.model_validate(item.expenseName) if item.expenseName else None
                )
            )

        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1

        return ExpensePaginationResponse(
            items=res_items,
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
            totalAmount=total_amount
        )

    @staticmethod
    def get_report(
        db: Session,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        group_id: Optional[str] = None,
        expense_name_id: Optional[str] = None
    ) -> ExpenseReportResponse:
        s_dt = parse_iso_datetime(start_date, is_end_of_day=False) if start_date else None
        e_dt = parse_iso_datetime(end_date, is_end_of_day=True) if end_date else None

        raw = ExpenseRepository.get_report_data(
            db=db,
            start_date=s_dt,
            end_date=e_dt,
            group_id=group_id,
            expense_name_id=expense_name_id
        )

        user_ids = [item.createdBy for item in raw.get("items", []) if item.createdBy]
        user_map = ExpenseService.get_user_name_map(db, user_ids)

        report_items = []
        for item in raw.get("items", []):
            resolved_name = item.expenseName.name if item.expenseName else (item.customName or "Unnamed Expense")
            exp_id = getattr(item, "expenseId", None) or f"EXP-{item.id[:6].upper()}"
            report_items.append(
                ExpenseResponse(
                    id=item.id,
                    expenseId=exp_id,
                    groupId=item.groupId,
                    groupName=item.group.name if item.group else None,
                    expenseNameId=item.expenseNameId,
                    customName=item.customName,
                    resolvedExpenseName=resolved_name,
                    amount=item.amount,
                    comment=item.comment,
                    note=item.comment,
                    expenseDate=item.expenseDate,
                    isDeleted=item.isDeleted,
                    ledgerTransactionId=item.ledgerTransactionId,
                    createdAt=item.createdAt,
                    updatedAt=item.updatedAt,
                    createdBy=item.createdBy,
                    creatorName=user_map.get(item.createdBy) if item.createdBy else None,
                    expenseName=ExpenseNameResponse.model_validate(item.expenseName) if item.expenseName else None
                )
            )

        breakdown = [
            ExpenseReportCategoryBreakdown(
                name=b["name"],
                amount=b["amount"],
                count=b["count"],
                percentage=b["percentage"]
            )
            for b in raw["breakdown"]
        ]

        group_breakdown = [
            ExpenseReportGroupBreakdown(
                groupId=g["groupId"],
                groupName=g["groupName"],
                amount=g["amount"],
                count=g["count"],
                percentage=g["percentage"]
            )
            for g in raw["groupBreakdown"]
        ]

        date_breakdown = [
            ExpenseReportDateBreakdown(
                date=d["date"],
                amount=d["amount"],
                count=d["count"]
            )
            for d in raw["dateBreakdown"]
        ]

        return ExpenseReportResponse(
            items=report_items,
            totalAmount=raw["totalAmount"],
            totalCount=raw["totalCount"],
            breakdown=breakdown,
            groupBreakdown=group_breakdown,
            dateBreakdown=date_breakdown,
            startDate=start_date,
            endDate=end_date,
            groupId=group_id,
            expenseNameId=expense_name_id
        )

    @staticmethod
    def get_ledger(
        db: Session,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        group_id: Optional[str] = None,
        expense_name_id: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> ExpenseLedgerResponse:
        s_dt = parse_iso_datetime(start_date) if start_date else None
        e_dt = parse_iso_datetime(end_date) if end_date else None

        items, total, total_amount = ExpenseRepository.get_ledger_data(
            db=db,
            start_date=s_dt,
            end_date=e_dt,
            group_id=group_id,
            expense_name_id=expense_name_id,
            search=search,
            page=page,
            page_size=page_size
        )

        user_ids = [item.createdBy for item in items if item.createdBy]
        user_map = ExpenseService.get_user_name_map(db, user_ids)

        ledger_items = []
        for item in items:
            resolved_name = item.expenseName.name if item.expenseName else (item.customName or "Unnamed Expense")
            ledger_items.append(
                ExpenseLedgerItem(
                    id=item.id,
                    date=item.expenseDate,
                    groupId=item.groupId,
                    groupName=item.group.name if item.group else "Unknown Group",
                    expenseName=resolved_name,
                    comment=item.comment,
                    debit=item.amount,
                    createdAt=item.createdAt,
                    createdBy=item.createdBy,
                    creatorName=user_map.get(item.createdBy) if item.createdBy else None
                )
            )

        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1

        return ExpenseLedgerResponse(
            items=ledger_items,
            totalAmount=total_amount,
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages
        )
