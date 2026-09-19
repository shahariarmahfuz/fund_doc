from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    dashboard,
    members,
    member_requests,
    groups,
    beneficiaries,
    donors,
    contributions,
    loans,
    grants,
    ledger,
    documents,
    reports,
    settings,
    users,
    roles,
    audit_logs,
    profile,
    expenses
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(members.router, prefix="/members", tags=["Members"])
api_router.include_router(member_requests.router, prefix="/member-requests", tags=["Member Requests"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(beneficiaries.router, prefix="/beneficiaries", tags=["Beneficiaries"])
api_router.include_router(donors.router, prefix="/donors", tags=["Donors"])
api_router.include_router(contributions.router, prefix="/contributions", tags=["Contributions"])
api_router.include_router(loans.router, prefix="/loans", tags=["Loans"])
api_router.include_router(loans.router, prefix="/qard-hasan", tags=["Qard Hasan"])
api_router.include_router(grants.router, prefix="/grants", tags=["Grants"])
api_router.include_router(grants.router, prefix="/sadaqah", tags=["Sadaqah"])
api_router.include_router(ledger.router, prefix="/ledger", tags=["Ledger"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles & Permissions"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(expenses.router, tags=["Expenses"])
