from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.auth import UserAuthProfile, ChangePasswordRequest, UpdateProfileRequest
from app.models import User, UserSession
from app.core.security import verify_password, get_password_hash
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_active_user
from app.core.exceptions import APIException

router = APIRouter()

@router.get("", response_model=APIResponse[UserAuthProfile])
def get_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    perms = AuthService.get_user_permissions(db, current_user.id)
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
            permissions=perms,
            preferences=current_user.preferences
        )
    )

@router.put("", response_model=APIResponse[dict])
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_reauth = False
    if payload.username != current_user.username:
        existing = db.query(User).filter(User.username == payload.username, User.id != current_user.id).first()
        if existing:
            raise APIException("Username is already taken.", code="DUPLICATE_USERNAME")
        # Invalidate old sessions if username changes
        db.query(UserSession).filter(UserSession.userId == current_user.id).delete()
        require_reauth = True

    current_user.name = payload.name
    current_user.username = payload.username
    current_user.mobile = payload.mobile
    if payload.email:
        current_user.email = payload.email

    db.commit()
    return APIResponse(success=True, data={
        "message": "Profile updated successfully.",
        "requireReauth": require_reauth
    })

@router.post("/change-password", response_model=APIResponse[dict])
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.currentPassword, current_user.password):
        raise APIException("Current password does not match.", code="INCORRECT_PASSWORD")

    current_user.password = get_password_hash(payload.newPassword)
    # Invalidate all sessions to require re-login
    db.query(UserSession).filter(UserSession.userId == current_user.id).delete()
    db.commit()
    return APIResponse(success=True, data={"message": "Password changed successfully. Please log in again."})
