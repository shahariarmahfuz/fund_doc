from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.schemas.common import BaseSchema

class LoginRequest(BaseModel):
    username: str
    password: str
    rememberMe: bool = False
    device: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: int
    user: "UserAuthProfile"

class UserAuthProfile(BaseSchema):
    id: str
    name: str
    username: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    role: str
    photo: Optional[str] = None
    permissions: List[str]
    preferences: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class UpdateProfileRequest(BaseModel):
    name: str
    username: str
    mobile: Optional[str] = None
    email: Optional[str] = None
