from datetime import datetime, timezone
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Member, Group, MonthlyContribution, ContributionPayment, SystemSettings, Document
from app.schemas.member import MemberDueItem, MemberCreate, MemberUpdate
from app.core.exceptions import APIException, NotFoundException

class MemberService:
    @staticmethod
    def generate_member_id(db: Session) -> str:
        members = db.query(Member.memberId).all()
        max_num = 0
        existing_set = set()

        for (m_id,) in members:
            if not m_id:
                continue
            existing_set.add(m_id)
            match = re.search(r'(\d+)$', m_id)
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num

        next_num = max_num + 1
        candidate = f"M-{str(next_num).zfill(4)}"
        while candidate in existing_set:
            next_num += 1
            candidate = f"M-{str(next_num).zfill(4)}"

        return candidate

    @staticmethod
    def update_member_paid_until(db: Session, member_id: str):
        all_paid = (
            db.query(MonthlyContribution.month, MonthlyContribution.year)
            .filter(
                MonthlyContribution.memberId == member_id,
                MonthlyContribution.status == "PAID",
                MonthlyContribution.isAdditional.is_(False)
            )
            .all()
        )

        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return

        if not all_paid:
            member.paidUntilMonth = None
            member.paidUntilYear = None
            db.flush()
            return

        sorted_paid = sorted(all_paid, key=lambda x: (x[1], x[0]))
        cur = sorted_paid[0]
        max_contiguous = cur

        for i in range(1, len(sorted_paid)):
            nxt = sorted_paid[i]
            if (nxt[1] == cur[1] and nxt[0] == cur[0] + 1) or (nxt[1] == cur[1] + 1 and nxt[0] == 1 and cur[0] == 12):
                cur = nxt
                max_contiguous = nxt
            elif nxt[1] == cur[1] and nxt[0] == cur[0]:
                continue
            else:
                break

        member.paidUntilMonth = max_contiguous[0]
        member.paidUntilYear = max_contiguous[1]
        db.flush()

    @staticmethod
    def get_monthly_membership_fee(db: Session) -> int:
        setting = (
            db.query(SystemSettings)
            .filter(SystemSettings.key.in_(["DEFAULT_MONTHLY_CONTRIBUTION", "membership.monthlyFee"]))
            .first()
        )
        if not setting or not setting.value:
            return 100
        try:
            fee = int(setting.value)
            return fee if fee > 0 else 100
        except ValueError:
            return 100

    @staticmethod
    def get_member_dues_list(db: Session) -> List[MemberDueItem]:
        monthly_fee = MemberService.get_monthly_membership_fee(db)
        now = datetime.now(timezone.utc)
        current_year = now.year
        current_month = now.month

        members = (
            db.query(Member)
            .join(Group, Member.groupId == Group.id)
            .filter(Member.status == "ACTIVE")
            .order_by(Member.memberId.asc())
            .all()
        )

        dues_list = []
        for m in members:
            # Last collection date
            last_payment = (
                db.query(ContributionPayment.paymentDate)
                .join(MonthlyContribution, ContributionPayment.monthlyContributionId == MonthlyContribution.id)
                .filter(MonthlyContribution.memberId == m.id)
                .order_by(ContributionPayment.paymentDate.desc())
                .first()
            )
            last_collection_date = last_payment[0].strftime("%d/%m/%Y") if last_payment else None

            # Contiguous paid until
            paid_until_str = None
            if m.paidUntilMonth and m.paidUntilYear:
                paid_until_str = f"{m.paidUntilMonth:02d}/{m.paidUntilYear}"

            # Calculate months overdue
            start_year = current_year
            start_month = current_month
            if m.joinDate:
                join_dt = m.joinDate.replace(tzinfo=timezone.utc) if m.joinDate.tzinfo is None else m.joinDate
                start_year = join_dt.year
                start_month = join_dt.month

            # Target month is current month
            # Calculate overdue months from (paidUntil + 1) up to current month
            if m.paidUntilMonth and m.paidUntilYear:
                months_diff = (current_year - m.paidUntilYear) * 12 + (current_month - m.paidUntilMonth)
            else:
                months_diff = (current_year - start_year) * 12 + (current_month - start_month) + 1

            months_overdue = max(0, months_diff)
            current_due = months_overdue * monthly_fee

            # Advance balance if paid ahead of current month
            advance_balance = 0
            if m.paidUntilMonth and m.paidUntilYear:
                future_diff = (m.paidUntilYear - current_year) * 12 + (m.paidUntilMonth - current_month)
                if future_diff > 0:
                    advance_balance = future_diff * monthly_fee

            dues_list.append(MemberDueItem(
                id=m.id,
                memberId=m.memberId,
                fullName=m.fullName or "নাম পাওয়া যায়নি",
                mobile=m.mobile,
                groupId=m.groupId,
                groupName=m.group.name if m.group else "Unknown Group",
                monthlyFee=monthly_fee,
                lastCollectionDate=last_collection_date,
                paidUntilMonth=m.paidUntilMonth,
                paidUntilYear=m.paidUntilYear,
                paidUntil=paid_until_str,
                monthsOverdue=months_overdue,
                currentDue=current_due,
                advanceBalance=advance_balance,
                status=m.status
            ))

        return dues_list
