from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models import User
from app.services.auth_service import AuthService, is_super_admin_role

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Extract and validate user from Bearer header or cookie."""
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
    jti = payload.get("jti")

    if not user_id:
        raise UnauthorizedException("Token missing user identity.", details={"code": "AUTH_TOKEN_INVALID"})

    # Validate session from DB with self-healing support
    if jti:
        user = AuthService.validate_session(db, jti, user_id=user_id)
        if not user:
            raise UnauthorizedException("Session has been revoked or expired.", details={"code": "AUTH_SESSION_REVOKED"})
        return user

    user = db.query(User).filter(User.id == user_id, User.status == "ACTIVE").first()
    if not user:
        raise UnauthorizedException("User account not found or inactive.", details={"code": "AUTH_USER_INACTIVE"})

    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.status != "ACTIVE":
        raise ForbiddenException("User account is inactive or suspended.")
    return current_user
