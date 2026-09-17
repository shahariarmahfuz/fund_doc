from typing import Optional, Dict
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class FoundationProfileUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    registrationNumber: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None

class FoundationProfileResponse(BaseSchema):
    id: Optional[str] = None
    name: str
    logo: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    registrationNumber: Optional[str] = None
    description: Optional[str] = None
    currency: str = "BDT"
    timezone: str = "Asia/Dhaka"
    language: str = "en"
    status: str = "ACTIVE"

class SystemSettingsBatchUpdate(BaseModel):
    settings: Dict[str, str]
    group: Optional[str] = "General"

class BrandingSettingsResponse(BaseModel):
    foundationName: str = "Foundation ERP"
    shortName: str = "ERP"
    logo: Optional[str] = None
    favicon: Optional[str] = None
    loginLogo: Optional[str] = None
    sidebarLogo: Optional[str] = None
    headerLogo: Optional[str] = None
    timezone: str = "Asia/Dhaka"
    dateFormat: str = "DD MMM YYYY"
