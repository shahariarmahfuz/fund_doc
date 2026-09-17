from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class DocumentCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DocumentCategoryResponse(BaseSchema):
    id: str
    name: str
    description: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

class DocumentCreate(BaseModel):
    title: str
    categoryId: Optional[str] = None
    targetType: str
    entityId: str
    description: Optional[str] = None
    remarks: Optional[str] = None
    fileBase64: Optional[str] = None
    secureUrl: Optional[str] = None
    cloudinaryPublicId: Optional[str] = None
    originalFilename: Optional[str] = "file"
    mimeType: Optional[str] = "application/octet-stream"
    sizeBytes: Optional[int] = 0

class DocumentResponse(BaseSchema):
    id: str
    documentNumber: str
    title: str
    categoryId: Optional[str] = None
    type: str
    cloudinaryPublicId: str
    secureUrl: str
    originalFilename: str
    mimeType: str
    sizeBytes: int
    targetType: str
    entityId: Optional[str] = None
    description: Optional[str] = None
    remarks: Optional[str] = None
    status: str
    createdAt: datetime
    updatedAt: datetime
