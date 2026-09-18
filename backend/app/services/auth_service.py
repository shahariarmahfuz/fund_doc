import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple, Set
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from app.models import User, UserSession, Role, Permission, RolePermission, UserPermission, AuditLog
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException, DatabaseUnavailableException
from app.core.cache import cache, app_cache

logger = logging.getLogger("app.auth")

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
        try:
            user = (
                db.query(User)
                .filter((User.username == username) | (User.email == username))
                .first()
            )
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error(f"Database error during user authentication: {exc}")
            raise DatabaseUnavailableException("Database is temporarily unavailable. Please try again.") from exc

        if not user or user.status != "ACTIVE":
            raise UnauthorizedException("ব্যবহারকারীর নাম বা ইমেইল সঠিক নয়।")

        if not verify_password(password, user.password):
            raise UnauthorizedException("পাসওয়ার্ড সঠিক নয়।")

        try:
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
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error(f"Database error updating user login audit: {exc}")
            # Audit failure is non-fatal for login if user is already authenticated
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

        try:
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
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error(f"Database error creating UserSession: {exc}")
            raise DatabaseUnavailableException("Database is temporarily unavailable. Please try again.") from exc

        return jti, expires_at

    @staticmethod
    def validate_session(db: Session, jti: str, user_id: Optional[str] = None) -> Optional[User]:
        """
        Validate a user session by jti.
        Returns User if session is active and valid.
        Returns None if session does not exist or has expired.
        Raises DatabaseUnavailableException if PostgreSQL is unreachable.
        """
        cached_user = app_cache.get(f"session:{jti}")
        if cached_user is not None:
            return cached_user

        try:
            session = (
                db.query(UserSession)
                .options(joinedload(UserSession.user).joinedload(User.role))
                .filter(UserSession.jti == jti)
                .first()
            )
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error(f"Database error during UserSession lookup: {exc}")
            raise DatabaseUnavailableException("Database temporarily unavailable during session validation.") from exc

        if not session:
            # Query succeeded; session legitimately does not exist or was logged out
            return None

        now = datetime.now(timezone.utc)

        # Timezone-safe expiration comparison
        expires_at = session.expiresAt
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < now:
            try:
                db.delete(session)
                db.commit()
            except SQLAlchemyError:
                db.rollback()
            return None

        # Update lastActive if older than 5 minutes (timezone-safe)
        last_active = session.lastActive
        if last_active.tzinfo is None:
            last_active = last_active.replace(tzinfo=timezone.utc)

        if (now - last_active).total_seconds() > 300:
            try:
                session.lastActive = now
                db.commit()
            except SQLAlchemyError:
                db.rollback()

        if session.user and session.user.status == "ACTIVE":
            app_cache.set(f"session:{jti}", session.user, ttl=300, tags=["session"])
            return session.user

        return None

    @staticmethod
    def refresh_session(db: Session, token: str) -> Tuple[str, str, int, User]:
        """Refresh an access token and return (new_access_token, new_refresh_token, expires_at, user)."""
        from jose import jwt, JWTError
        from app.core.config import settings

        payload = None
        try:
            payload = decode_access_token(token)
        except Exception:
            pass

        if not payload:
            try:
                # Decode with verify_exp=False to allow refreshing expired tokens within a grace window
                payload = jwt.decode(
                    token, 
                    settings.SECRET_KEY, 
                    algorithms=[settings.ALGORITHM],
                    options={"verify_exp": False}
                )
                exp = payload.get("exp", 0)
                # Max grace window: 30 days
                if datetime.now(timezone.utc).timestamp() - exp > 30 * 86400:
                    raise UnauthorizedException("Session has expired beyond the refresh window. Please log in again.", details={"code": "AUTH_SESSION_REVOKED"})
            except JWTError:
                raise UnauthorizedException("Invalid token provided for refresh.", details={"code": "AUTH_TOKEN_INVALID"})

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Token missing user identity.", details={"code": "AUTH_TOKEN_INVALID"})

        try:
            user = db.query(User).options(joinedload(User.role)).filter(User.id == user_id).first()
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error(f"Database error during refresh token user lookup: {exc}")
            raise DatabaseUnavailableException("Database is temporarily unavailable during token refresh.") from exc

        if not user or user.status != "ACTIVE":
            raise UnauthorizedException("User account is inactive or not found.", details={"code": "AUTH_SESSION_REVOKED"})

        new_jti = str(uuid.uuid4())
        days = 30 if payload.get("rememberMe") or (payload.get("exp", 0) - payload.get("iat", 0) > 86400 * 2) else 1
        expires_at_dt = datetime.now(timezone.utc) + timedelta(days=days)

        try:
            new_session = UserSession(
                userId=user.id,
                jti=new_jti,
                device=payload.get("device", "Web"),
                expiresAt=expires_at_dt,
                lastActive=datetime.now(timezone.utc)
            )
            db.add(new_session)
            db.commit()
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error(f"Database error creating UserSession on refresh: {exc}")
            raise DatabaseUnavailableException("Database is temporarily unavailable during token refresh.") from exc

        expires_delta = timedelta(days=days)
        new_access_token = create_access_token(
            subject=user.id,
            expires_delta=expires_delta,
            custom_claims={
                "username": user.username,
                "role": user.role.name if user.role else "USER",
                "jti": new_jti,
                "name": user.name,
                "email": user.email
            }
        )
        new_refresh_token = create_access_token(
            subject=user.id,
            expires_delta=timedelta(days=30),
            custom_claims={
                "type": "refresh",
                "jti": new_jti,
                "username": user.username
            }
        )
        expires_at_ts = int(expires_at_dt.timestamp())
        app_cache.set(f"session:{new_jti}", user, ttl=60, tags=["session"])
        return new_access_token, new_refresh_token, expires_at_ts, user

