from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.core.database import get_db
from app.core.cache import app_cache
from app.schemas.common import APIResponse
from app.schemas.dashboard import DashboardStats, GroupDistributionItem, MonthlyChartItem, MetricComparison
from app.models import Member, Group, Beneficiary, Grant, Loan, LoanRepayment, MonthlyContribution, Fund, LedgerEntry, LedgerTransaction
from app.services.finance_service import FinancialService
from app.dependencies.permissions import require_permission

router = APIRouter()

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def calculate_comparison(
    current: float,
    previous: Optional[float],
    has_data: bool
) -> MetricComparison:
    if not has_data:
        return MetricComparison(
            current=0.0,
            previous=None,
            change_percentage=None,
            has_comparison=False,
            has_data=False
        )
    
    if previous is None:
        return MetricComparison(
            current=float(current),
            previous=None,
            change_percentage=None,
            has_comparison=False,
            has_data=True
        )
    
    if previous == 0:
        return MetricComparison(
            current=float(current),
            previous=float(previous),
            change_percentage=None,
            has_comparison=False,
            has_data=True
        )
    
    change_pct = round(((current - previous) / abs(previous)) * 100.0, 1)
    return MetricComparison(
        current=float(current),
        previous=float(previous),
        change_percentage=change_pct,
        has_comparison=True,
        has_data=True
    )

@router.get("/stats", response_model=APIResponse[DashboardStats])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Dashboard", "View Dashboard"))
):
    cache_key = "dashboard_stats"
    cached_stats = app_cache.get(cache_key)
    if cached_stats:
        return APIResponse(success=True, data=cached_stats)

    now = datetime.now(timezone.utc)
    six_months_ago = now - timedelta(days=180)
    start_of_current_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    if now.month == 1:
        prev_month = 12
        prev_year = now.year - 1
    else:
        prev_month = now.month - 1
        prev_year = now.year

    # Core Counts
    member_statuses = (
        db.query(Member.status, func.count(Member.id))
        .group_by(Member.status)
        .all()
    )
    total_members = sum(c for _, c in member_statuses)
    active_members = sum(c for s, c in member_statuses if s == "ACTIVE")
    inactive_members = total_members - active_members

    total_groups = db.query(Group).count()
    total_beneficiaries = db.query(Beneficiary).count()
    total_grants = db.query(Grant).count()

    loan_stats = db.query(
        func.coalesce(func.sum(case((Loan.status == "ACTIVE", 1), else_=0)), 0).label("active_loans"),
        func.coalesce(func.sum(case((Loan.status.in_(["ACTIVE", "DEFAULTED"]), Loan.amount), else_=0)), 0).label("loan_amount"),
    ).first()
    total_active_loans = int(loan_stats.active_loans) if loan_stats else 0
    total_loan_amount = float(loan_stats.loan_amount) if loan_stats else 0.0

    total_repaid = (
        db.query(func.sum(LoanRepayment.amount))
        .join(Loan, LoanRepayment.loanId == Loan.id)
        .filter(Loan.status.in_(["ACTIVE", "DEFAULTED"]))
        .scalar() or 0
    )
    outstanding_loan_amount = float(total_loan_amount - total_repaid)

    # Financial Summaries
    group_summaries = FinancialService.get_all_group_summaries(db)

    # 1. Total Cash Balance & Foundation Fund
    gen_stats = (
        db.query(
            func.count(LedgerEntry.id).label("total_count"),
            func.coalesce(func.sum(case((LedgerEntry.isCredit.is_(False), LedgerEntry.amount), else_=0)), 0).label("total_debit"),
            func.coalesce(func.sum(case((LedgerEntry.isCredit.is_(True), LedgerEntry.amount), else_=0)), 0).label("total_credit"),
            func.coalesce(func.sum(case((LedgerEntry.createdAt < start_of_current_month, 1), else_=0)), 0).label("prev_count"),
            func.coalesce(func.sum(case(((LedgerEntry.createdAt < start_of_current_month) & (LedgerEntry.isCredit.is_(False)), LedgerEntry.amount), else_=0)), 0).label("prev_debit"),
            func.coalesce(func.sum(case(((LedgerEntry.createdAt < start_of_current_month) & (LedgerEntry.isCredit.is_(True)), LedgerEntry.amount), else_=0)), 0).label("prev_credit"),
        )
        .join(Fund, LedgerEntry.fundId == Fund.id)
        .filter(Fund.groupId.is_(None))
        .first()
    )

    if not gen_stats or gen_stats.total_count == 0:
        current_cash_comp = calculate_comparison(0.0, None, has_data=False)
    else:
        curr_cash = float(gen_stats.total_debit - gen_stats.total_credit)
        if gen_stats.prev_count == 0:
            current_cash_comp = calculate_comparison(curr_cash, None, has_data=True)
        else:
            prev_cash = float(gen_stats.prev_debit - gen_stats.prev_credit)
            current_cash_comp = calculate_comparison(curr_cash, prev_cash, has_data=True)

    foundation_total_fund_comp = current_cash_comp.model_copy()

    # 2. Group Funds
    curr_grp_funds = float(sum(s["currentBalance"] for s in group_summaries))
    grp_stats = (
        db.query(
            func.count(LedgerEntry.id).label("total_grp_entries"),
            func.coalesce(func.sum(case((LedgerEntry.createdAt < start_of_current_month, 1), else_=0)), 0).label("prev_grp_entries"),
            func.coalesce(func.sum(case(((LedgerEntry.createdAt < start_of_current_month) & (LedgerEntry.isCredit.is_(True)), LedgerEntry.amount), else_=0)), 0).label("prev_credits"),
            func.coalesce(func.sum(case(((LedgerEntry.createdAt < start_of_current_month) & (LedgerEntry.isCredit.is_(False)), LedgerEntry.amount), else_=0)), 0).label("prev_debits"),
        )
        .join(Fund, LedgerEntry.fundId == Fund.id)
        .filter(Fund.groupId.isnot(None))
        .first()
    )

    if not grp_stats or grp_stats.total_grp_entries == 0:
        group_funds_comp = calculate_comparison(0.0, None, has_data=False)
    elif grp_stats.prev_grp_entries == 0:
        group_funds_comp = calculate_comparison(curr_grp_funds, None, has_data=True)
    else:
        prev_grp_funds = float(grp_stats.prev_credits - grp_stats.prev_debits)
        group_funds_comp = calculate_comparison(curr_grp_funds, prev_grp_funds, has_data=True)

    # 3. Monthly Contributions
    contrib_stats = (
        db.query(
            func.count(MonthlyContribution.id).label("total_paid_count"),
            func.coalesce(func.sum(case(((MonthlyContribution.year == now.year) & (MonthlyContribution.month == now.month), MonthlyContribution.expectedAmount), else_=0)), 0).label("curr_paid"),
            func.coalesce(func.sum(case(((MonthlyContribution.year == prev_year) & (MonthlyContribution.month == prev_month), 1), else_=0)), 0).label("prev_paid_count"),
            func.coalesce(func.sum(case(((MonthlyContribution.year == prev_year) & (MonthlyContribution.month == prev_month), MonthlyContribution.expectedAmount), else_=0)), 0).label("prev_paid_sum"),
        )
        .filter(MonthlyContribution.status == "PAID")
        .first()
    )

    if not contrib_stats or contrib_stats.total_paid_count == 0:
        contributions_comp = calculate_comparison(0.0, None, has_data=False)
    elif contrib_stats.prev_paid_count == 0:
        contributions_comp = calculate_comparison(float(contrib_stats.curr_paid), None, has_data=True)
    else:
        contributions_comp = calculate_comparison(float(contrib_stats.curr_paid), float(contrib_stats.prev_paid_sum), has_data=True)

    group_distribution = [
        GroupDistributionItem(name=s["groupName"], value=float(s["currentBalance"]))
        for s in group_summaries
    ]

    # 6 Month Trend Chart Data
    # Initialize 6 months in reverse order
    month_data = {}
    for i in range(5, -1, -1):
        dt = now - timedelta(days=i * 30)
        month_label = MONTH_NAMES[dt.month - 1]
        month_data[month_label] = {"month": month_label, "contributions": 0.0, "loans": 0.0, "grants": 0.0}

    recent_contributions = (
        db.query(MonthlyContribution.expectedAmount, MonthlyContribution.createdAt)
        .filter(MonthlyContribution.status == "PAID", MonthlyContribution.createdAt >= six_months_ago)
        .all()
    )
    for amt, c_at in recent_contributions:
        m_label = MONTH_NAMES[c_at.month - 1]
        if m_label in month_data:
            month_data[m_label]["contributions"] += float(amt)

    recent_loans = (
        db.query(Loan.amount, Loan.createdAt)
        .filter(Loan.createdAt >= six_months_ago)
        .all()
    )
    for amt, c_at in recent_loans:
        m_label = MONTH_NAMES[c_at.month - 1]
        if m_label in month_data:
            month_data[m_label]["loans"] += float(amt)

    recent_grants = (
        db.query(Grant.amount, Grant.createdAt)
        .filter(Grant.createdAt >= six_months_ago)
        .all()
    )
    for amt, c_at in recent_grants:
        m_label = MONTH_NAMES[c_at.month - 1]
        if m_label in month_data:
            month_data[m_label]["grants"] += float(amt)

    monthly_chart = [
        MonthlyChartItem(**v) for v in month_data.values()
    ]

    stats_data = DashboardStats(
        totalMembers=total_members,
        activeMembers=active_members,
        inactiveMembers=inactive_members,
        totalGroups=total_groups,
        foundationTotalFund=foundation_total_fund_comp,
        totalGroupFunds=group_funds_comp,
        currentCashBalance=current_cash_comp,
        totalContributions=contributions_comp,
        totalActiveLoans=total_active_loans,
        outstandingLoanAmount=outstanding_loan_amount,
        totalGrants=total_grants,
        totalBeneficiaries=total_beneficiaries,
        groupFundDistribution=group_distribution,
        monthlyChartData=monthly_chart
    )
    app_cache.set(cache_key, stats_data, ttl_seconds=30, tags=["dashboard"])

    return APIResponse(
        success=True,
        data=stats_data
    )
