import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import User, UserSession, Role, Permission, RolePermission, UserPermission, AuditLog
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.exceptions import UnauthorizedException, APIException
from app.core.cache import cache, app_cache
from sqlalchemy.orm import joinedload

def is_super_admin_role(role_name: Optional[str]) -> bool:
    if not role_name:
        return False
    cleaned = role_name.strip().lower().replace(" ", "").replace("_", "").replace("-", "")
    return (
        cleaned in ["superadmin", "adminsuper"] or
        role_name.strip() in ["Super Admin", "SUPER_ADMIN"]
    )

class AuthService:
    @staticmethod
    def get_user_permissions(db: Session, user_id: str) -> List[str]:
        cache_key = f"auth:perms:{user_id}"
        cached_perms = cache.get(cache_key)
        if cached_perms is not None:
            return cached_perms

        user = db.query(User).options(joinedload(User.role)).filter(User.id == user_id).first()
        if not user or not user.role:
            return []

        # Super Admin always gets wildcard "*"
        if is_super_admin_role(user.role.name):
            cache.set(cache_key, ["*"], ttl=300, tags=["auth", "permissions"])
            return ["*"]

        permissions = set()

        # Role permissions
        role_perms = (
            db.query(Permission.module, Permission.action)
            .join(RolePermission, Permission.id == RolePermission.permissionId)
            .filter(RolePermission.roleId == user.roleId)
            .all()
        )
        for m, a in role_perms:
            permissions.add(f"{m}:{a}")

        # Custom User permissions
        user_perms = (
            db.query(Permission.module, Permission.action)
            .join(UserPermission, Permission.id == UserPermission.permissionId)
            .filter(UserPermission.userId == user.id)
            .all()
        )
        for m, a in user_perms:
            permissions.add(f"{m}:{a}")

        result = list(permissions)
        cache.set(cache_key, result, ttl=300, tags=["auth", "permissions"])
        return result

    @staticmethod
    def authenticate_user(
        db: Session, 
        username: str, 
        password: str,
        ip_address: Optional[str] = None,
        device: Optional[str] = None,
        browser: Optional[str] = None,
        os_info: Optional[str] = None
    ) -> User:
        user = (
            db.query(User)
            .filter((User.username == username) | (User.email == username))
            .first()
        )

        if not user or user.status != "ACTIVE":
            raise UnauthorizedException("ব্যবহারকারীর নাম বা ইমেইল সঠিক নয়।")

        if not verify_password(password, user.password):
            raise UnauthorizedException("পাসওয়ার্ড সঠিক নয়।")

        user.lastLogin = datetime.now(timezone.utc)
        
        # Log login audit
        db.add(AuditLog(
            userId=user.id,
            action="LOGIN",
            module="AUTHENTICATION",
            ipAddress=ip_address,
            device=device,
            browser=browser,
            remarks=f"User {user.username} logged in successfully"
        ))
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def create_session(
        db: Session,
        user_id: str,
        remember_me: bool = False,
        device: Optional[str] = None,
        browser: Optional[str] = None,
        os_info: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[str, datetime]:
        jti = str(uuid.uuid4())
        days = 30 if remember_me else 1
        expires_at = datetime.now(timezone.utc) + timedelta(days=days)

        session = UserSession(
            userId=user_id,
            jti=jti,
            device=device,
            browser=browser,
            os=os_info,
            ipAddress=ip_address,
            expiresAt=expires_at,
            lastActive=datetime.now(timezone.utc)
        )
        db.add(session)
        db.commit()
        return jti, expires_at

    @staticmethod
    def validate_session(db: Session, jti: str) -> Optional[User]:
        cached_user = app_cache.get(f"session:{jti}")
        if cached_user is not None:
            return cached_user

        session = (
            db.query(UserSession)
            .options(joinedload(UserSession.user).joinedload(User.role))
            .filter(UserSession.jti == jti)
            .first()
        )
        if not session:
            return None

        now = datetime.now(timezone.utc)
        if session.expiresAt.replace(tzinfo=timezone.utc) < now:
            db.delete(session)
            db.commit()
            return None

        # Update lastActive if older than 5 minutes
        if (now - session.lastActive.replace(tzinfo=timezone.utc)).total_seconds() > 300:
            session.lastActive = now
            db.commit()

        app_cache.set(f"session:{jti}", session.user, ttl=60, tags=["session"])
        return session.user
