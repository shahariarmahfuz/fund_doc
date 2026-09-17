from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import ForbiddenException
from app.models import User
from app.dependencies.auth import get_current_active_user
from app.services.auth_service import AuthService, is_super_admin_role

def check_user_permission(permissions: list[str], module: str, action: str, role_name: str | None = None) -> bool:
    if role_name and is_super_admin_role(role_name):
        return True

    if "*" in permissions:
        return True

    target_module = module.strip().lower()
    target_action = action.strip().lower()

    for perm in permissions:
        if perm == "*":
            return True

        parts = perm.split(":")
        if len(parts) != 2:
            continue

        p_mod, p_act = parts[0].strip().lower(), parts[1].strip().lower()

        if p_mod == target_module or p_mod == "*":
            if (
                p_act == target_action
                or p_act == "*"
                or p_act == "manage"
                or (target_action in ["create", "add"] and p_act in ["create", "add"])
                or (target_action.startswith("view") and p_act.startswith("view"))
            ):
                return True

    return False

def require_permission(module: str, action: str):
    """Dependency factory that enforces granular role-based authorization."""
    def dependency(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        role_name = current_user.role.name if current_user.role else None
        if role_name and is_super_admin_role(role_name):
            return current_user

        permissions = AuthService.get_user_permissions(db, current_user.id)
        allowed = check_user_permission(permissions, module, action, role_name)
        if not allowed:
            raise ForbiddenException(
                f"You do not have permission to perform '{action}' on '{module}'."
            )
        return current_user

    return dependency

def require_super_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Dependency that restricts access exclusively to Super Admin users."""
    role_name = current_user.role.name if current_user.role else None
    if not is_super_admin_role(role_name):
        raise ForbiddenException("Only Super Admins are authorized to perform this action.")
    return current_user

