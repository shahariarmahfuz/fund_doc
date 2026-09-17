from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models import Fund, Group, LedgerTransaction, LedgerEntry
from app.schemas.ledger import LedgerEntryInput
from app.core.exceptions import APIException

class LedgerEngine:
    @staticmethod
    def create_transaction(
        db: Session,
        date: datetime,
        type: str,
        entries: List[LedgerEntryInput],
        reference_id: Optional[str] = None,
        member_id: Optional[str] = None,
        donor_id: Optional[str] = None,
        notes: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> LedgerTransaction:
        """
        Creates a balanced double-entry ledger transaction.
        Total Debits must exactly equal Total Credits.
        """
        total_debit = sum(e.amount for e in entries if not e.isCredit)
        total_credit = sum(e.amount for e in entries if e.isCredit)

        if total_debit != total_credit:
            raise APIException(
                message=f"Ledger entries must balance. Total Debit ({total_debit}) != Total Credit ({total_credit})",
                code="LEDGER_UNBALANCED"
            )

        if total_debit <= 0:
            raise APIException(
                message="Transaction amount must be strictly positive.",
                code="LEDGER_NON_POSITIVE"
            )

        # Fetch funds with their groups to denormalize groupCode and groupName
        fund_ids = list(set(e.fundId for e in entries))
        funds = db.query(Fund).filter(Fund.id.in_(fund_ids)).all()
        fund_map: Dict[str, Fund] = {f.id: f for f in funds}

        tx = LedgerTransaction(
            date=date,
            type=type,
            referenceId=reference_id,
            memberId=member_id,
            donorId=donor_id,
            notes=notes,
            createdBy=created_by,
            status="COMPLETED"
        )
        db.add(tx)
        db.flush()

        for entry_input in entries:
            fund = fund_map.get(entry_input.fundId)
            entry = LedgerEntry(
                transactionId=tx.id,
                fundId=entry_input.fundId,
                isCredit=entry_input.isCredit,
                amount=entry_input.amount,
                createdBy=created_by,
                groupId=fund.group.id if (fund and fund.group) else None,
                groupCode=fund.group.code if (fund and fund.group) else None,
                groupName=fund.group.name if (fund and fund.group) else None
            )
            db.add(entry)

        db.flush()
        from app.core.cache import app_cache
        app_cache.invalidate_tag("dashboard")
        app_cache.invalidate_tag("groups")
        return tx

    @staticmethod
    def get_or_create_funds(db: Session, group_id: Optional[str]) -> Tuple[Fund, Fund]:
        """Automatically fetches or creates a group's fund and the general foundation fund."""
        general_fund = db.query(Fund).filter(Fund.groupId.is_(None)).first()
        if not general_fund:
            general_fund = Fund(
                name="General Foundation Fund",
                description="Main unallocated asset pool"
            )
            db.add(general_fund)
            db.flush()

        if not group_id:
            return general_fund, general_fund

        group_fund = db.query(Fund).filter(Fund.groupId == group_id).first()
        if not group_fund:
            group = db.query(Group).filter(Group.id == group_id).first()
            if not group:
                raise APIException(f"Group not found for id: {group_id}", code="GROUP_NOT_FOUND")
            group_fund = Fund(
                groupId=group_id,
                name=f"{group.name} Fund",
                description=f"Auto-generated fund for {group.name}"
            )
            db.add(group_fund)
            db.flush()

        return group_fund, general_fund
