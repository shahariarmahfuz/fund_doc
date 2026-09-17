from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.user import RoleWithPermissionsResponse, PermissionResponse, RolePermissionsUpdate
from app.models import Role, Permission, RolePermission
from app.dependencies.permissions import require_permission
from app.core.exceptions import NotFoundException

router = APIRouter()

@router.get("", response_model=APIResponse[List[RoleWithPermissionsResponse]])
def get_roles(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Roles & Permissions", "View"))
):
    roles = db.query(Role).order_by(Role.createdAt.asc()).all()
    results = []
    for r in roles:
        role_perms = (
            db.query(Permission)
            .join(RolePermission, Permission.id == RolePermission.permissionId)
            .filter(RolePermission.roleId == r.id)
            .all()
        )
        results.append(RoleWithPermissionsResponse(
            id=r.id,
            name=r.name,
            description=r.description,
            createdAt=r.createdAt,
            updatedAt=r.updatedAt,
            permissions=[PermissionResponse.model_validate(p) for p in role_perms]
        ))
    return APIResponse(success=True, data=results)

@router.get("/permissions", response_model=APIResponse[List[PermissionResponse]])
def get_permissions(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Roles & Permissions", "View"))
):
    perms = db.query(Permission).order_by(Permission.module.asc(), Permission.action.asc()).all()
    return APIResponse(success=True, data=perms)

@router.put("/{id}/permissions", response_model=APIResponse[dict])
def update_role_permissions(
    id: str,
    payload: RolePermissionsUpdate,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Roles & Permissions", "Manage"))
):
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise NotFoundException("Role not found.")

    db.query(RolePermission).filter(RolePermission.roleId == id).delete()
    for pid in payload.permissionIds:
        db.add(RolePermission(roleId=id, permissionId=pid))

    db.commit()
    return APIResponse(success=True, data={"message": "Role permissions updated successfully."})
