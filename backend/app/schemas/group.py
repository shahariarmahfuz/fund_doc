from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class GroupBase(BaseModel):
    name: str
    code: str
    shortName: Optional[str] = None
    description: Optional[str] = None
    remarks: Optional[str] = None
    status: str = "ACTIVE"
    isFoundationGroup: bool = False
    memberSignupEnabled: bool = True

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    shortName: Optional[str] = None
    description: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = None
    isFoundationGroup: Optional[bool] = None
    memberSignupEnabled: Optional[bool] = None

class GroupResponse(BaseSchema, GroupBase):
    id: str
    foundationId: str
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[str] = None
    updatedBy: Optional[str] = None
    memberCount: Optional[int] = 0
    currentFund: Optional[float] = 0.0
