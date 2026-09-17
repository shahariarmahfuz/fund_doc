from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from app.models.expense import ExpenseName, Expense
from app.models.foundation import Group
from app.models.base import get_utc_now

class ExpenseRepository:
    @staticmethod
    def get_name_by_id(db: Session, id: str) -> Optional[ExpenseName]:
        return db.query(ExpenseName).filter(ExpenseName.id == id).first()

    @staticmethod
    def get_name_by_name(db: Session, name: str) -> Optional[ExpenseName]:
        clean = name.strip()
        return db.query(ExpenseName).filter(func.lower(ExpenseName.name) == clean.lower()).first()

    @staticmethod
    def list_names(db: Session, active_only: bool = False) -> List[ExpenseName]:
        query = db.query(ExpenseName)
        if active_only:
            query = query.filter(ExpenseName.isActive.is_(True))
        return query.order_by(ExpenseName.name.asc()).all()

    @staticmethod
    def create_name(db: Session, name: str, note: Optional[str] = None, user_id: Optional[str] = None) -> ExpenseName:
        exp_name = ExpenseName(
            name=name.strip(),
            note=note.strip() if note else None,
            isActive=True,
            createdBy=user_id,
            updatedBy=user_id
        )
        db.add(exp_name)
        db.commit()
        db.refresh(exp_name)
        return exp_name

    @staticmethod
    def update_name(
        db: Session,
        expense_name: ExpenseName,
        name: Optional[str] = None,
        note: Optional[str] = None,
        is_active: Optional[bool] = None,
        user_id: Optional[str] = None
    ) -> ExpenseName:
        if name is not None:
            expense_name.name = name.strip()
        if note is not None:
            expense_name.note = note.strip() if note else None
        if is_active is not None:
            expense_name.isActive = is_active
        expense_name.updatedBy = user_id
        expense_name.updatedAt = get_utc_now()
        db.commit()
        db.refresh(expense_name)
        return expense_name

    @staticmethod
    def delete_name(db: Session, expense_name: ExpenseName) -> None:
        db.delete(expense_name)
        db.commit()


    @staticmethod
    def get_expense_by_id(db: Session, id: str, include_deleted: bool = False) -> Optional[Expense]:
        query = (
            db.query(Expense)
            .options(joinedload(Expense.expenseName), joinedload(Expense.group))
            .filter(Expense.id == id)
        )
        if not include_deleted:
            query = query.filter(Expense.isDeleted.is_(False))
        return query.first()

    @staticmethod
    def list_expenses(
        db: Session,
        search: Optional[str] = None,
        group_id: Optional[str] = None,
        expense_name_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 10,
        sort_by: str = "expenseDate",
        sort_desc: bool = True
    ) -> Tuple[List[Expense], int, Decimal]:
        query = (
            db.query(Expense)
            .options(joinedload(Expense.expenseName), joinedload(Expense.group))
            .outerjoin(ExpenseName, Expense.expenseNameId == ExpenseName.id)
            .outerjoin(Group, Expense.groupId == Group.id)
        )
        query = query.filter(Expense.isDeleted.is_(False))

        if group_id:
            query = query.filter(Expense.groupId == group_id)

        if expense_name_id:
            query = query.filter(Expense.expenseNameId == expense_name_id)

        if start_date:
            query = query.filter(Expense.expenseDate >= start_date)

        if end_date:
            query = query.filter(Expense.expenseDate <= end_date)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Expense.expenseId.ilike(term),
                    Expense.customName.ilike(term),
                    ExpenseName.name.ilike(term),
                    Expense.comment.ilike(term),
                    Group.name.ilike(term)
                )
            )

        total = query.count()

        # Compute total sum for the filtered set
        sum_query = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .outerjoin(ExpenseName, Expense.expenseNameId == ExpenseName.id)
            .outerjoin(Group, Expense.groupId == Group.id)
            .filter(Expense.isDeleted.is_(False))
        )
        if group_id:
            sum_query = sum_query.filter(Expense.groupId == group_id)
        if expense_name_id:
            sum_query = sum_query.filter(Expense.expenseNameId == expense_name_id)
        if start_date:
            sum_query = sum_query.filter(Expense.expenseDate >= start_date)
        if end_date:
            sum_query = sum_query.filter(Expense.expenseDate <= end_date)
        if search and search.strip():
            term = f"%{search.strip()}%"
            sum_query = sum_query.filter(
                or_(
                    Expense.expenseId.ilike(term),
                    Expense.customName.ilike(term),
                    ExpenseName.name.ilike(term),
                    Expense.comment.ilike(term),
                    Group.name.ilike(term)
                )
            )
        total_amount = Decimal(str(sum_query.scalar() or 0))

        # Order by
        order_col = Expense.expenseDate if sort_by == "expenseDate" else Expense.createdAt
        query = query.order_by(order_col.desc() if sort_desc else order_col.asc(), Expense.createdAt.desc())

        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total, total_amount

    @staticmethod
    def create_expense(
        db: Session,
        group_id: str,
        expense_name_id: Optional[str],
        custom_name: Optional[str],
        amount: Decimal,
        comment: Optional[str],
        expense_date: datetime,
        ledger_transaction_id: Optional[str] = None,
        expense_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Expense:
        expense = Expense(
            expenseId=expense_id,
            groupId=group_id,
            expenseNameId=expense_name_id,
            customName=custom_name.strip() if custom_name else None,
            amount=amount,
            comment=comment.strip() if comment else None,
            expenseDate=expense_date,
            ledgerTransactionId=ledger_transaction_id,
            isDeleted=False,
            createdBy=user_id,
            updatedBy=user_id
        )
        db.add(expense)
        db.flush()
        return expense

    @staticmethod
    def update_expense(
        db: Session,
        expense: Expense,
        group_id: Optional[str] = None,
        expense_name_id: Optional[str] = None,
        custom_name: Optional[str] = None,
        amount: Optional[Decimal] = None,
        comment: Optional[str] = None,
        expense_date: Optional[datetime] = None,
        ledger_transaction_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Expense:
        if group_id is not None:
            expense.groupId = group_id
        if expense_name_id is not None:
            expense.expenseNameId = expense_name_id if expense_name_id else None
        if custom_name is not None:
            expense.customName = custom_name.strip() if custom_name else None
        if amount is not None:
            expense.amount = amount
        if comment is not None:
            expense.comment = comment.strip() if comment else None
        if expense_date is not None:
            expense.expenseDate = expense_date
        if ledger_transaction_id is not None:
            expense.ledgerTransactionId = ledger_transaction_id

        expense.updatedBy = user_id
        expense.updatedAt = get_utc_now()
        db.flush()
        return expense

    @staticmethod
    def soft_delete_expense(db: Session, expense: Expense, user_id: Optional[str] = None) -> Expense:
        expense.isDeleted = True
        expense.deletedAt = get_utc_now()
        expense.deletedBy = user_id
        expense.updatedBy = user_id
        expense.updatedAt = get_utc_now()
        db.flush()
        return expense

    @staticmethod
    def get_report_data(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_id: Optional[str] = None,
        expense_name_id: Optional[str] = None
    ) -> Dict[str, Any]:
        base_filter = [Expense.isDeleted.is_(False)]
        if group_id:
            base_filter.append(Expense.groupId == group_id)
        if expense_name_id:
            base_filter.append(Expense.expenseNameId == expense_name_id)
        if start_date:
            base_filter.append(Expense.expenseDate >= start_date)
        if end_date:
            base_filter.append(Expense.expenseDate <= end_date)

        # Total amount and count
        total_sum = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(*base_filter).scalar() or 0
        total_count = db.query(func.count(Expense.id)).filter(*base_filter).scalar() or 0
        total_amount = Decimal(str(total_sum))

        # Category breakdown
        category_expr = func.coalesce(ExpenseName.name, Expense.customName, "Other")
        cat_rows = (
            db.query(
                category_expr.label("category_name"),
                func.sum(Expense.amount).label("category_amount"),
                func.count(Expense.id).label("category_count")
            )
            .outerjoin(ExpenseName, Expense.expenseNameId == ExpenseName.id)
            .filter(*base_filter)
            .group_by(category_expr)
            .order_by(func.sum(Expense.amount).desc())
            .all()
        )

        breakdown = []
        for cat_name, cat_amt, cat_cnt in cat_rows:
            amt = Decimal(str(cat_amt or 0))
            pct = round(float(amt / total_amount * 100), 2) if total_amount > 0 else 0.0
            breakdown.append({
                "name": cat_name,
                "amount": amt,
                "count": cat_cnt,
                "percentage": pct
            })

        # Group breakdown
        grp_rows = (
            db.query(
                Group.id.label("grp_id"),
                Group.name.label("grp_name"),
                func.sum(Expense.amount).label("grp_amount"),
                func.count(Expense.id).label("grp_count")
            )
            .join(Group, Expense.groupId == Group.id)
            .filter(*base_filter)
            .group_by(Group.id, Group.name)
            .order_by(func.sum(Expense.amount).desc())
            .all()
        )

        group_breakdown = []
        for g_id, g_name, g_amt, g_cnt in grp_rows:
            amt = Decimal(str(g_amt or 0))
            pct = round(float(amt / total_amount * 100), 2) if total_amount > 0 else 0.0
            group_breakdown.append({
                "groupId": g_id,
                "groupName": g_name,
                "amount": amt,
                "count": g_cnt,
                "percentage": pct
            })

        # Date breakdown
        date_expr = func.to_char(Expense.expenseDate, "YYYY-MM-DD")
        date_rows = (
            db.query(
                date_expr.label("exp_date"),
                func.sum(Expense.amount).label("date_amount"),
                func.count(Expense.id).label("date_count")
            )
            .filter(*base_filter)
            .group_by(date_expr)
            .order_by(date_expr.asc())
            .all()
        )

        date_breakdown = [
            {
                "date": str(d_str),
                "amount": Decimal(str(d_amt or 0)),
                "count": d_cnt
            }
            for d_str, d_amt, d_cnt in date_rows
        ]

        # Query all filtered expense records ordered by date descending
        items = (
            db.query(Expense)
            .options(joinedload(Expense.expenseName), joinedload(Expense.group))
            .filter(*base_filter)
            .order_by(Expense.expenseDate.desc(), Expense.createdAt.desc())
            .all()
        )

        return {
            "items": items,
            "totalAmount": total_amount,
            "totalCount": total_count,
            "breakdown": breakdown,
            "groupBreakdown": group_breakdown,
            "dateBreakdown": date_breakdown
        }

    @staticmethod
    def get_ledger_data(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_id: Optional[str] = None,
        expense_name_id: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Tuple[List[Expense], int, Decimal]:
        query = (
            db.query(Expense)
            .options(joinedload(Expense.expenseName), joinedload(Expense.group))
            .outerjoin(ExpenseName, Expense.expenseNameId == ExpenseName.id)
            .outerjoin(Group, Expense.groupId == Group.id)
            .filter(Expense.isDeleted.is_(False))
        )

        if group_id:
            query = query.filter(Expense.groupId == group_id)
        if expense_name_id:
            query = query.filter(Expense.expenseNameId == expense_name_id)
        if start_date:
            query = query.filter(Expense.expenseDate >= start_date)
        if end_date:
            query = query.filter(Expense.expenseDate <= end_date)
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Expense.customName.ilike(term),
                    ExpenseName.name.ilike(term),
                    Expense.comment.ilike(term),
                    Group.name.ilike(term)
                )
            )

        total = query.count()

        # Compute total sum for ledger
        sum_query = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .outerjoin(ExpenseName, Expense.expenseNameId == ExpenseName.id)
            .outerjoin(Group, Expense.groupId == Group.id)
            .filter(Expense.isDeleted.is_(False))
        )
        if group_id:
            sum_query = sum_query.filter(Expense.groupId == group_id)
        if expense_name_id:
            sum_query = sum_query.filter(Expense.expenseNameId == expense_name_id)
        if start_date:
            sum_query = sum_query.filter(Expense.expenseDate >= start_date)
        if end_date:
            sum_query = sum_query.filter(Expense.expenseDate <= end_date)
        if search and search.strip():
            term = f"%{search.strip()}%"
            sum_query = sum_query.filter(
                or_(
                    Expense.customName.ilike(term),
                    ExpenseName.name.ilike(term),
                    Expense.comment.ilike(term),
                    Group.name.ilike(term)
                )
            )
        total_amount = Decimal(str(sum_query.scalar() or 0))

        # Chronological sorting for ledger (oldest to newest date, then createdAt)
        query = query.order_by(Expense.expenseDate.asc(), Expense.createdAt.asc())
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total, total_amount
