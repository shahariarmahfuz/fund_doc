from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Fund, Group, Member, LedgerEntry, LedgerTransaction

class FinancialService:
    @staticmethod
    def get_group_fund_summary(db: Session, group_id: str) -> Dict[str, Any]:
        """Calculates financial summary for a specific group fund."""
        if not group_id:
            return {
                "currentBalance": 0,
                "totalFund": 0,
                "totalContributions": 0,
                "totalDonations": 0,
                "totalLoans": 0,
                "totalLoanReturns": 0,
                "totalGrants": 0,
                "totalExpenses": 0,
                "memberCount": 0,
                "totalTransactions": 0
            }

        group_fund = db.query(Fund).filter(Fund.groupId == group_id).first()
        member_count = db.query(Member).filter(Member.groupId == group_id, Member.status == "ACTIVE").count()

        if not group_fund:
            return {
                "currentBalance": 0,
                "totalFund": 0,
                "totalContributions": 0,
                "totalDonations": 0,
                "totalLoans": 0,
                "totalLoanReturns": 0,
                "totalGrants": 0,
                "totalExpenses": 0,
                "memberCount": member_count,
                "totalTransactions": 0
            }

        # Credits query with transaction types
        credits = (
            db.query(LedgerEntry.amount, LedgerTransaction.type)
            .join(LedgerTransaction, LedgerEntry.transactionId == LedgerTransaction.id)
            .filter(LedgerEntry.fundId == group_fund.id, LedgerEntry.isCredit.is_(True))
            .all()
        )

        # Debits query with transaction types
        debits = (
            db.query(LedgerEntry.amount, LedgerTransaction.type)
            .join(LedgerTransaction, LedgerEntry.transactionId == LedgerTransaction.id)
            .filter(LedgerEntry.fundId == group_fund.id, LedgerEntry.isCredit.is_(False))
            .all()
        )

        # Transaction count
        tx_count = (
            db.query(func.count(func.distinct(LedgerEntry.transactionId)))
            .filter(LedgerEntry.fundId == group_fund.id)
            .scalar() or 0
        )

        total_contributions = sum(amt for amt, tx_type in credits if tx_type == "CONTRIBUTION")
        total_loan_returns = sum(amt for amt, tx_type in credits if tx_type == "REPAYMENT")
        total_donations = sum(amt for amt, tx_type in credits if tx_type == "DONATION")

        total_loans = sum(amt for amt, tx_type in debits if tx_type == "LOAN")
        total_grants = sum(amt for amt, tx_type in debits if tx_type == "GRANT")
        total_expenses = sum(amt for amt, tx_type in debits if tx_type == "EXPENSE")

        total_fund = total_contributions + total_donations
        current_balance = total_fund - total_grants - total_expenses - total_loans + total_loan_returns

        return {
            "currentBalance": current_balance,
            "totalFund": total_fund,
            "totalContributions": total_contributions,
            "totalDonations": total_donations,
            "totalLoans": total_loans,
            "totalLoanReturns": total_loan_returns,
            "totalGrants": total_grants,
            "totalExpenses": total_expenses,
            "memberCount": member_count,
            "totalTransactions": tx_count,
        }

    @staticmethod
    def get_foundation_summary(db: Session) -> Dict[str, Any]:
        """Gets the general foundation fund (Cash) summary."""
        general_fund = db.query(Fund).filter(Fund.groupId.is_(None)).first()
        if not general_fund:
            return {"cashBalance": 0.0}

        debit_sum = (
            db.query(func.sum(LedgerEntry.amount))
            .filter(LedgerEntry.fundId == general_fund.id, LedgerEntry.isCredit.is_(False))
            .scalar() or 0
        )

        credit_sum = (
            db.query(func.sum(LedgerEntry.amount))
            .filter(LedgerEntry.fundId == general_fund.id, LedgerEntry.isCredit.is_(True))
            .scalar() or 0
        )

        cash_balance = float(debit_sum - credit_sum)
        return {"cashBalance": cash_balance}

    @staticmethod
    def get_all_group_summaries(db: Session) -> List[Dict[str, Any]]:
        """Retrieves aggregated summaries for all groups in a single optimized query."""
        from sqlalchemy import case
        groups = db.query(Group.id, Group.name).all()
        if not groups:
            return []

        rows = (
            db.query(
                Fund.groupId,
                func.coalesce(func.sum(case(((LedgerEntry.isCredit.is_(True)) & (LedgerTransaction.type == 'CONTRIBUTION'), LedgerEntry.amount), else_=0)), 0).label('total_contrib'),
                func.coalesce(func.sum(case(((LedgerEntry.isCredit.is_(True)) & (LedgerTransaction.type == 'DONATION'), LedgerEntry.amount), else_=0)), 0).label('total_donations'),
                func.coalesce(func.sum(case(((LedgerEntry.isCredit.is_(True)) & (LedgerTransaction.type == 'REPAYMENT'), LedgerEntry.amount), else_=0)), 0).label('total_loan_returns'),
                func.coalesce(func.sum(case(((LedgerEntry.isCredit.is_(False)) & (LedgerTransaction.type == 'LOAN'), LedgerEntry.amount), else_=0)), 0).label('total_loans'),
                func.coalesce(func.sum(case(((LedgerEntry.isCredit.is_(False)) & (LedgerTransaction.type == 'GRANT'), LedgerEntry.amount), else_=0)), 0).label('total_grants'),
                func.coalesce(func.sum(case(((LedgerEntry.isCredit.is_(False)) & (LedgerTransaction.type == 'EXPENSE'), LedgerEntry.amount), else_=0)), 0).label('total_expenses'),
            )
            .join(LedgerEntry, LedgerEntry.fundId == Fund.id)
            .join(LedgerTransaction, LedgerEntry.transactionId == LedgerTransaction.id)
            .filter(Fund.groupId.isnot(None))
            .group_by(Fund.groupId)
            .all()
        )

        batch_map = {}
        for r in rows:
            gid, contrib, don, loan_ret, loan, grant, exp = r
            tot_fund = contrib + don
            bal = tot_fund - grant - exp - loan + loan_ret
            batch_map[gid] = {
                "totalFund": tot_fund,
                "totalContributions": contrib,
                "totalDonations": don,
                "currentBalance": bal
            }

        summaries = []
        for g_id, g_name in groups:
            b = batch_map.get(g_id, {
                "totalFund": 0,
                "totalContributions": 0,
                "totalDonations": 0,
                "currentBalance": 0
            })
            summaries.append({
                "groupId": g_id,
                "groupName": g_name,
                "currentBalance": b["currentBalance"],
                "totalFund": b["totalFund"],
                "totalContributions": b["totalContributions"],
                "totalDonations": b["totalDonations"]
            })
        return summaries
