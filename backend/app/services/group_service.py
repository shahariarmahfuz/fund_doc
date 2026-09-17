import json
from typing import Dict, Any, List, Set
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import (
    Group,
    Member,
    MemberStatusHistory,
    MonthlyContribution,
    ContributionPayment,
    Loan,
    LoanRepayment,
    Fund,
    FundAllocation,
    Document,
    Expense,
    Beneficiary,
    CampaignContribution,
    BeneficiaryPayment,
    LedgerEntry,
    LedgerTransaction,
    MemberRequest,
    AuditLog,
)
from app.core.exceptions import APIException, NotFoundException
from app.core.logging import logger

class GroupService:
    @staticmethod
    def hard_delete_group(db: Session, group_id: str, current_user_id: str) -> Dict[str, Any]:
        """
        Permanently deletes a Group and ALL its Group-owned dependent records
        within a single atomic PostgreSQL transaction.
        
        If ANY step fails, rolls back completely.
        Ensures all foreign-key constraints are satisfied in dependency order.
        """
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise NotFoundException("Group not found.")

        group_code = group.code
        group_name = group.name

        logger.info(f"[HARD_DELETE] Starting hard delete for group '{group_code}' (id: {group_id}) by user {current_user_id}")

        try:
            # -------------------------------------------------------------
            # 1. DISCOVERY & DEPENDENCY IDENTIFICATION
            # -------------------------------------------------------------
            # Members belonging to this group
            members = db.query(Member.id).filter(Member.groupId == group_id).all()
            member_ids = [m[0] for m in members]

            # Funds belonging to this group
            funds = db.query(Fund.id).filter(Fund.groupId == group_id).all()
            group_fund_ids = [f[0] for f in funds]

            # Expenses belonging to this group
            expenses = db.query(Expense.id, Expense.ledgerTransactionId).filter(Expense.groupId == group_id).all()
            expense_ids = [e[0] for e in expenses]
            exp_tx_ids = [e[1] for e in expenses if e[1]]

            # Monthly contributions & payments for members
            mc_ids = []
            cp_tx_ids = []
            if member_ids:
                mcs = db.query(MonthlyContribution.id).filter(MonthlyContribution.memberId.in_(member_ids)).all()
                mc_ids = [mc[0] for mc in mcs]
                if mc_ids:
                    cps = db.query(ContributionPayment.id, ContributionPayment.ledgerTransactionId).filter(
                        ContributionPayment.monthlyContributionId.in_(mc_ids)
                    ).all()
                    cp_tx_ids = [cp[1] for cp in cps if cp[1]]

            # Loans & loan repayments for members
            member_loan_ids = []
            lr_tx_ids = []
            if member_ids:
                loans = db.query(Loan.id).filter(Loan.memberId.in_(member_ids)).all()
                member_loan_ids = [l[0] for l in loans]
                if member_loan_ids:
                    lrs = db.query(LoanRepayment.id, LoanRepayment.ledgerTransactionId).filter(
                        LoanRepayment.loanId.in_(member_loan_ids)
                    ).all()
                    lr_tx_ids = [lr[1] for lr in lrs if lr[1]]

            # Loans allocated from this group's funds (if any loans belong to non-members but were funded by this group)
            if group_fund_ids:
                alloc_loans = db.query(FundAllocation.loanId).filter(
                    FundAllocation.fundId.in_(group_fund_ids),
                    FundAllocation.loanId.isnot(None)
                ).all()
                for al in alloc_loans:
                    if al[0] and al[0] not in member_loan_ids:
                        member_loan_ids.append(al[0])

            # Discover all ledger transactions connected to group funds or member activities
            all_tx_ids: Set[str] = set()
            all_tx_ids.update(cp_tx_ids)
            all_tx_ids.update(lr_tx_ids)
            all_tx_ids.update(exp_tx_ids)

            # Transactions with ledger entries in this group's funds or with this group ID
            entry_filters = []
            if group_fund_ids:
                entry_filters.append(LedgerEntry.fundId.in_(group_fund_ids))
            entry_filters.append(LedgerEntry.groupId == group_id)
            
            tx_lines = db.query(LedgerEntry.transactionId).filter(or_(*entry_filters)).distinct().all()
            for tl in tx_lines:
                if tl[0]:
                    all_tx_ids.add(tl[0])

            # Transactions referencing group members directly
            if member_ids:
                member_txs = db.query(LedgerTransaction.id).filter(
                    or_(
                        LedgerTransaction.memberId.in_(member_ids),
                        LedgerTransaction.referenceId.in_(member_ids)
                    )
                ).all()
                for mtx in member_txs:
                    if mtx[0]:
                        all_tx_ids.add(mtx[0])

            # Transactions referencing group ID as referenceId
            group_ref_txs = db.query(LedgerTransaction.id).filter(LedgerTransaction.referenceId == group_id).all()
            for gtx in group_ref_txs:
                if gtx[0]:
                    all_tx_ids.add(gtx[0])

            all_tx_ids_list = list(all_tx_ids)

            logger.info(
                f"[HARD_DELETE] Group {group_code}: Found {len(member_ids)} members, "
                f"{len(group_fund_ids)} funds, {len(expense_ids)} expenses, "
                f"{len(member_loan_ids)} loans, {len(all_tx_ids_list)} ledger transactions"
            )

            # -------------------------------------------------------------
            # 2. ATOMIC CASCADE DELETION IN DEPENDENCY ORDER
            # -------------------------------------------------------------

            # Step A: Disconnect external Beneficiary references to members
            if member_ids:
                db.query(Beneficiary).filter(Beneficiary.memberId.in_(member_ids)).update(
                    {Beneficiary.memberId: None}, synchronize_session=False
                )

            # Step B: Remove CampaignContributions pointing to members or transactions
            if member_ids:
                db.query(CampaignContribution).filter(CampaignContribution.memberId.in_(member_ids)).delete(
                    synchronize_session=False
                )
            if all_tx_ids_list:
                db.query(CampaignContribution).filter(
                    CampaignContribution.ledgerTransactionId.in_(all_tx_ids_list)
                ).delete(synchronize_session=False)

            # Step C: Remove BeneficiaryPayments referencing transactions to be deleted
            if all_tx_ids_list:
                db.query(BeneficiaryPayment).filter(
                    BeneficiaryPayment.ledgerTransactionId.in_(all_tx_ids_list)
                ).delete(synchronize_session=False)

            # Step D: Delete ContributionPayments (child of MonthlyContribution & LedgerTransaction)
            if mc_ids:
                db.query(ContributionPayment).filter(
                    ContributionPayment.monthlyContributionId.in_(mc_ids)
                ).delete(synchronize_session=False)
            if all_tx_ids_list:
                db.query(ContributionPayment).filter(
                    ContributionPayment.ledgerTransactionId.in_(all_tx_ids_list)
                ).delete(synchronize_session=False)

            # Step E: Delete MonthlyContributions (child of Member)
            if mc_ids:
                db.query(MonthlyContribution).filter(MonthlyContribution.id.in_(mc_ids)).delete(
                    synchronize_session=False
                )

            # Step F: Delete LoanRepayments (child of Loan & LedgerTransaction)
            if member_loan_ids:
                db.query(LoanRepayment).filter(LoanRepayment.loanId.in_(member_loan_ids)).delete(
                    synchronize_session=False
                )
            if all_tx_ids_list:
                db.query(LoanRepayment).filter(
                    LoanRepayment.ledgerTransactionId.in_(all_tx_ids_list)
                ).delete(synchronize_session=False)

            # Step G: Delete FundAllocations referencing group funds or loans
            alloc_filters = []
            if group_fund_ids:
                alloc_filters.append(FundAllocation.fundId.in_(group_fund_ids))
            if member_loan_ids:
                alloc_filters.append(FundAllocation.loanId.in_(member_loan_ids))
            if alloc_filters:
                db.query(FundAllocation).filter(or_(*alloc_filters)).delete(synchronize_session=False)

            # Step H: Delete Documents for loans, members, and group
            doc_filters = [Document.groupId == group_id]
            if member_loan_ids:
                doc_filters.append(Document.loanId.in_(member_loan_ids))
            if member_ids:
                doc_filters.append(Document.memberId.in_(member_ids))
            db.query(Document).filter(or_(*doc_filters)).delete(synchronize_session=False)

            # Step I: Delete Loans
            if member_loan_ids:
                db.query(Loan).filter(Loan.id.in_(member_loan_ids)).delete(synchronize_session=False)

            # Step J: Delete MemberStatusHistory
            if member_ids:
                db.query(MemberStatusHistory).filter(MemberStatusHistory.memberId.in_(member_ids)).delete(
                    synchronize_session=False
                )

            # Step K: Delete Expenses for this group
            db.query(Expense).filter(Expense.groupId == group_id).delete(synchronize_session=False)
            if all_tx_ids_list:
                db.query(Expense).filter(Expense.ledgerTransactionId.in_(all_tx_ids_list)).update(
                    {Expense.ledgerTransactionId: None}, synchronize_session=False
                )

            # Step L: Delete LedgerEntries
            entry_delete_filters = []
            if all_tx_ids_list:
                entry_delete_filters.append(LedgerEntry.transactionId.in_(all_tx_ids_list))
            if group_fund_ids:
                entry_delete_filters.append(LedgerEntry.fundId.in_(group_fund_ids))
            entry_delete_filters.append(LedgerEntry.groupId == group_id)
            db.query(LedgerEntry).filter(or_(*entry_delete_filters)).delete(synchronize_session=False)

            # Step M: Delete LedgerTransactions
            if all_tx_ids_list:
                db.query(LedgerTransaction).filter(LedgerTransaction.id.in_(all_tx_ids_list)).delete(
                    synchronize_session=False
                )

            # Step N: Delete Members
            if member_ids:
                db.query(Member).filter(Member.id.in_(member_ids)).delete(synchronize_session=False)

            # Step O: Delete Funds
            if group_fund_ids:
                db.query(Fund).filter(Fund.id.in_(group_fund_ids)).delete(synchronize_session=False)

            # Step P: Disconnect MemberRequests that referenced this group
            db.query(MemberRequest).filter(MemberRequest.groupId == group_id).update(
                {MemberRequest.groupId: None}, synchronize_session=False
            )

            # Step Q: Delete the Group row itself
            db.query(Group).filter(Group.id == group_id).delete(synchronize_session=False)

            # Step R: Write tamper-evident AuditLog entry
            audit = AuditLog(
                userId=current_user_id,
                action="HARD_DELETE",
                module="Groups",
                referenceId=group_id,
                oldValue=json.dumps({"code": group_code, "name": group_name, "id": group_id}),
                newValue=None,
                remarks=f"Super Admin permanently deleted group {group_code} ({group_name}) and all dependent records."
            )
            db.add(audit)

            # Step S: Atomic COMMIT
            db.commit()

            logger.info(f"[HARD_DELETE] Successfully deleted group '{group_code}' and all related records.")

            return {
                "message": "Group deleted permanently.",
                "groupId": group_id,
                "groupCode": group_code,
                "deletedMembersCount": len(member_ids),
                "deletedFundsCount": len(group_fund_ids),
                "deletedTransactionsCount": len(all_tx_ids_list)
            }

        except Exception as e:
            db.rollback()
            logger.error(f"[HARD_DELETE] Rollback due to error deleting group {group_id}: {e}", exc_info=True)
            if isinstance(e, (APIException, NotFoundException)):
                raise e
            raise APIException(
                message=f"Failed to permanently delete group: {str(e)}",
                code="GROUP_DELETE_FAILED",
                status_code=500
            )
