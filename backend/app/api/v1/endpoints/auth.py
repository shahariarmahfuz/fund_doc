from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import create_access_token
from app.core.config import settings
from app.models import User
from app.schemas.common import APIResponse
from app.schemas.auth import LoginRequest, TokenResponse, UserAuthProfile, ChangePasswordRequest
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_active_user
from app.core.exceptions import APIException

router = APIRouter()

@router.post("/login", response_model=APIResponse[TokenResponse])
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")

    user = AuthService.authenticate_user(
        db=db,
        username=payload.username,
        password=payload.password,
        ip_address=ip,
        device=payload.device or "Desktop",
        browser=payload.browser or user_agent[:100],
        os_info=payload.os or "Unknown"
    )

    jti, expires_at = AuthService.create_session(
        db=db,
        user_id=user.id,
        remember_me=payload.rememberMe,
        device=payload.device,
        browser=payload.browser,
        os_info=payload.os,
        ip_address=ip
    )

    permissions = AuthService.get_user_permissions(db, user.id)

    expires_delta = timedelta(days=30) if payload.rememberMe else timedelta(days=1)
    access_token = create_access_token(
        subject=user.id,
        expires_delta=expires_delta,
        custom_claims={
            "username": user.username,
            "role": user.role.name if user.role else "USER",
            "jti": jti,
            "name": user.name,
            "email": user.email
        }
    )

    # Set secure HttpOnly cookie as well
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=int(expires_delta.total_seconds())
    )

    user_profile = UserAuthProfile(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        mobile=user.mobile,
        role=user.role.name if user.role else "USER",
        photo=user.photo,
        permissions=permissions,
        preferences=user.preferences
    )

    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_at=int(expires_at.timestamp()),
            user=user_profile
        )
    )

@router.get("/me", response_model=APIResponse[UserAuthProfile])
def get_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    permissions = AuthService.get_user_permissions(db, current_user.id)
    return APIResponse(
        success=True,
        data=UserAuthProfile(
            id=current_user.id,
            name=current_user.name,
            username=current_user.username,
            email=current_user.email,
            mobile=current_user.mobile,
            role=current_user.role.name if current_user.role else "USER",
            photo=current_user.photo,
            permissions=permissions,
            preferences=current_user.preferences
        )
    )

@router.post("/logout", response_model=APIResponse[dict])
def logout(
    response: Response,
    current_user: User = Depends(get_current_active_user)
):
    response.delete_cookie(key="access_token")
    return APIResponse(success=True, data={"message": "Successfully logged out."})
