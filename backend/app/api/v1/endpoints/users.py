from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.user import (
    UserResponse,
    UserCreate,
    UserUpdate,
    UserWithPermissionsDetail,
    UserPermissionsUpdate
)
from app.models import User, Role, Permission, UserPermission
from app.core.security import get_password_hash
from app.services.auth_service import AuthService
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

@router.get("", response_model=APIResponse[List[UserResponse]])
def get_users(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Users", "View"))
):
    users = db.query(User).order_by(User.createdAt.desc()).all()
    return APIResponse(success=True, data=users)

@router.get("/{id}", response_model=APIResponse[UserWithPermissionsDetail])
def get_user(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Users", "View"))
):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise NotFoundException("User not found.")

    permissions = AuthService.get_user_permissions(db, u.id)
    res = UserWithPermissionsDetail(
        id=u.id,
        name=u.name,
        username=u.username,
        email=u.email,
        mobile=u.mobile,
        roleId=u.roleId,
        status=u.status,
        lastLogin=u.lastLogin,
        photo=u.photo,
        preferences=u.preferences,
        createdAt=u.createdAt,
        updatedAt=u.updatedAt,
        role=u.role,
        permissions=permissions
    )
    return APIResponse(success=True, data=res)

@router.post("", response_model=APIResponse[UserResponse])
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Users", "Manage"))
):
    if db.query(User).filter(User.username == payload.username).first():
        raise APIException("Username already in use.", code="DUPLICATE_USERNAME")

    if payload.email and db.query(User).filter(User.email == payload.email).first():
        raise APIException("Email already in use.", code="DUPLICATE_EMAIL")

    if payload.mobile and db.query(User).filter(User.mobile == payload.mobile).first():
        raise APIException("Mobile number already in use.", code="DUPLICATE_MOBILE")

    hashed_pw = get_password_hash(payload.password)
    user = User(
        name=payload.name,
        username=payload.username,
        email=payload.email,
        mobile=payload.mobile,
        password=hashed_pw,
        roleId=payload.roleId,
        status=payload.status or "ACTIVE"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return APIResponse(success=True, data=user)

@router.put("/{id}", response_model=APIResponse[UserResponse])
def update_user(
    id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Users", "Manage"))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException("User not found.")

    update_dict = payload.model_dump(exclude_unset=True)

    if "username" in update_dict and update_dict["username"] and update_dict["username"] != user.username:
        if db.query(User).filter(User.username == update_dict["username"], User.id != id).first():
            raise APIException("Username already in use.", code="DUPLICATE_USERNAME")

    if "email" in update_dict and update_dict["email"] and update_dict["email"] != user.email:
        if db.query(User).filter(User.email == update_dict["email"], User.id != id).first():
            raise APIException("Email already in use.", code="DUPLICATE_EMAIL")

    if "mobile" in update_dict and update_dict["mobile"] and update_dict["mobile"] != user.mobile:
        if db.query(User).filter(User.mobile == update_dict["mobile"], User.id != id).first():
            raise APIException("Mobile number already in use.", code="DUPLICATE_MOBILE")

    if "password" in update_dict and update_dict["password"]:
        update_dict["password"] = get_password_hash(update_dict["password"])

    for k, v in update_dict.items():
        setattr(user, k, v)

    db.commit()
    db.refresh(user)
    return APIResponse(success=True, data=user)

@router.put("/{id}/permissions", response_model=APIResponse[dict])
def update_user_permissions(
    id: str,
    payload: UserPermissionsUpdate,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Users", "Manage"))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException("User not found.")

    db.query(UserPermission).filter(UserPermission.userId == id).delete()
    for pid in payload.permissionIds:
        db.add(UserPermission(userId=id, permissionId=pid))

    db.commit()
    return APIResponse(success=True, data={"message": "User permissions updated successfully."})

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_user(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Users", "Manage"))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException("User not found.")

    db.delete(user)
    db.commit()
    return APIResponse(success=True, data={"message": "User deleted successfully."})
