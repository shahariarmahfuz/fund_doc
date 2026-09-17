from sqlalchemy import Column, String, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Role(Base):
    __tablename__ = "Role"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    users = relationship("User", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "Permission"

    id = Column(String, primary_key=True, default=generate_uuid)
    module = Column(String, nullable=False)
    action = Column(String, nullable=False)
    description = Column(String, nullable=True)

    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    userPermissions = relationship("UserPermission", back_populates="permission", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("module", "action", name="Permission_module_action_key"),
    )

class RolePermission(Base):
    __tablename__ = "RolePermission"

    roleId = Column(String, ForeignKey("Role.id", ondelete="CASCADE"), primary_key=True)
    permissionId = Column(String, ForeignKey("Permission.id", ondelete="CASCADE"), primary_key=True)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    mobile = Column(String, unique=True, nullable=True, index=True)
    password = Column(String, nullable=False)
    roleId = Column(String, ForeignKey("Role.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String, default="ACTIVE", nullable=False)
    lastLogin = Column(DateTime, nullable=True)
    photo = Column(String, nullable=True)
    preferences = Column(String, nullable=True)  # JSON string
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    role = relationship("Role", back_populates="users")
    auditLogs = relationship("AuditLog", back_populates="user")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    userPermissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "UserSession"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    jti = Column(String, unique=True, nullable=False, index=True)
    device = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    ipAddress = Column(String, nullable=True)
    lastActive = Column(DateTime, default=get_utc_now, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="sessions")

class UserPermission(Base):
    __tablename__ = "UserPermission"

    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), primary_key=True)
    permissionId = Column(String, ForeignKey("Permission.id", ondelete="CASCADE"), primary_key=True)

    user = relationship("User", back_populates="userPermissions")
    permission = relationship("Permission", back_populates="userPermissions")

class AuditLog(Base):
    __tablename__ = "AuditLog"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String, nullable=False)
    module = Column(String, nullable=False)
    referenceId = Column(String, nullable=True)
    oldValue = Column(String, nullable=True)
    newValue = Column(String, nullable=True)
    ipAddress = Column(String, nullable=True)
    device = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="auditLogs")
