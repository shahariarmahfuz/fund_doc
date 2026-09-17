from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.user import AuditLogResponse
from app.models import AuditLog
from app.dependencies.permissions import require_permission

router = APIRouter()

@router.get("", response_model=APIResponse[List[AuditLogResponse]])
def get_audit_logs(
    limit: int = 500,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "View"))
):
    logs = db.query(AuditLog).order_by(AuditLog.createdAt.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append(AuditLogResponse(
            id=l.id,
            userId=l.userId,
            action=l.action,
            module=l.module,
            referenceId=l.referenceId,
            oldValue=l.oldValue,
            newValue=l.newValue,
            ipAddress=l.ipAddress,
            device=l.device,
            browser=l.browser,
            remarks=l.remarks,
            createdAt=l.createdAt,
            user={"name": l.user.name, "username": l.user.username} if l.user else None
        ))
    return APIResponse(success=True, data=results)
