from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class UserCreate(BaseModel):
    name: str
    username: str
    password: str
    roleId: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    status: str = "ACTIVE"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    roleId: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    status: Optional[str] = None

class RoleBase(BaseSchema):
    id: str
    name: str
    description: Optional[str] = None

class PermissionResponse(BaseSchema):
    id: str
    module: str
    action: str
    description: Optional[str] = None

class RoleWithPermissionsResponse(RoleBase):
    createdAt: datetime
    updatedAt: datetime
    permissions: List[PermissionResponse] = []

class UserResponse(BaseSchema):
    id: str
    name: str
    username: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    roleId: str
    status: str
    lastLogin: Optional[datetime] = None
    photo: Optional[str] = None
    preferences: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    role: Optional[RoleBase] = None

class UserWithPermissionsDetail(UserResponse):
    permissions: List[str] = []

class RolePermissionsUpdate(BaseModel):
    permissionIds: List[str]

class UserPermissionsUpdate(BaseModel):
    permissionIds: List[str]

class AuditLogResponse(BaseSchema):
    id: str
    userId: Optional[str] = None
    action: str
    module: str
    referenceId: Optional[str] = None
    oldValue: Optional[str] = None
    newValue: Optional[str] = None
    ipAddress: Optional[str] = None
    device: Optional[str] = None
    browser: Optional[str] = None
    remarks: Optional[str] = None
    createdAt: datetime
    user: Optional[dict] = None
