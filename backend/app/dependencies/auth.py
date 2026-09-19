from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models import User, Role
from app.services.auth_service import is_super_admin_role

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> User:
    """Extract and validate user from Bearer header or cookie statelessly via JWT."""
    token: Optional[str] = None
    
    # 1. Bearer Header
    if credentials:
        token = credentials.credentials
    
    # 2. Cookies fallback
    if not token:
        token = (
            request.cookies.get("access_token")
            or request.cookies.get("next-auth.session-token")
            or request.cookies.get("__Secure-next-auth.session-token")
        )

    if not token:
        raise UnauthorizedException("Authentication token required.", details={"code": "AUTH_TOKEN_REQUIRED"})

    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired authentication token.", details={"code": "AUTH_TOKEN_EXPIRED"})

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token missing user identity.", details={"code": "AUTH_TOKEN_INVALID"})

    role_name = payload.get("role") or "Super Admin"
    username = payload.get("username") or "admin"
    name = payload.get("name") or username
    email = payload.get("email") or f"{username}@foundation.org"
    permissions = payload.get("permissions") or (["*"] if is_super_admin_role(role_name) else [])

    user = User(
        id=user_id,
        username=username,
        name=name,
        email=email,
        status="ACTIVE"
    )
    user.role = Role(name=role_name)
    user._permissions = permissions
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.status != "ACTIVE":
        raise ForbiddenException("User account is inactive or suspended.")
    return current_user

