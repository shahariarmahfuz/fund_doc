from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.document import (
    DocumentCategoryResponse,
    DocumentCategoryCreate,
    DocumentResponse,
    DocumentCreate
)
from app.models import Document, DocumentCategory
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException, NotFoundException

router = APIRouter()

def generate_document_number(db: Session) -> str:
    count = db.query(Document).count()
    year = datetime.now(timezone.utc).year
    return f"DOC-{year}-{str(count + 1).zfill(5)}"

@router.get("/categories", response_model=APIResponse[List[DocumentCategoryResponse]])
def get_document_categories(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "View"))
):
    cats = db.query(DocumentCategory).order_by(DocumentCategory.name.asc()).all()
    return APIResponse(success=True, data=cats)

@router.post("/categories", response_model=APIResponse[DocumentCategoryResponse])
def create_document_category(
    payload: DocumentCategoryCreate,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "Add"))
):
    if db.query(DocumentCategory).filter(DocumentCategory.name == payload.name).first():
        raise APIException("Category with this name already exists.", code="DUPLICATE_CATEGORY")

    cat = DocumentCategory(name=payload.name, description=payload.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return APIResponse(success=True, data=cat)

@router.get("", response_model=APIResponse[List[DocumentResponse]])
def get_documents(
    targetType: Optional[str] = None,
    entityId: Optional[str] = None,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "View"))
):
    query = db.query(Document)
    if targetType:
        query = query.filter(Document.targetType == targetType)
    if entityId:
        query = query.filter(Document.entityId == entityId)
    docs = query.order_by(Document.createdAt.desc()).all()
    return APIResponse(success=True, data=docs)

@router.post("", response_model=APIResponse[DocumentResponse])
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Settings", "Manage"))
):
    doc_num = generate_document_number(db)
    doc_type = "IMAGE" if payload.mimeType and payload.mimeType.startswith("image/") else "PDF"

    doc = Document(
        documentNumber=doc_num,
        title=payload.title,
        categoryId=payload.categoryId,
        type=doc_type,
        cloudinaryPublicId=payload.cloudinaryPublicId or doc_num,
        secureUrl=payload.secureUrl or "",
        originalFilename=payload.originalFilename or "file",
        mimeType=payload.mimeType or "application/octet-stream",
        sizeBytes=payload.sizeBytes or 0,
        targetType=payload.targetType,
        entityId=payload.entityId,
        description=payload.description,
        remarks=payload.remarks,
        status="ACTIVE",
        createdBy=current_user.id
    )

    # Link relation according to targetType
    if payload.targetType == "MEMBER":
        doc.memberId = payload.entityId
    elif payload.targetType == "BENEFICIARY":
        doc.beneficiaryId = payload.entityId
    elif payload.targetType == "LOAN":
        doc.loanId = payload.entityId
    elif payload.targetType == "GRANT":
        doc.grantId = payload.entityId
    elif payload.targetType == "DONOR":
        doc.donorId = payload.entityId

    db.add(doc)
    db.commit()
    db.refresh(doc)
    return APIResponse(success=True, data=doc)

@router.put("/{id}", response_model=APIResponse[DocumentResponse])
def update_document(
    id: str,
    payload: dict,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "Manage"))
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise NotFoundException("Document not found.")

    for k, v in payload.items():
        if hasattr(doc, k):
            setattr(doc, k, v)

    db.commit()
    db.refresh(doc)
    return APIResponse(success=True, data=doc)

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_document(
    id: str,
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "Delete"))
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise NotFoundException("Document not found.")
    db.delete(doc)
    db.commit()
    return APIResponse(success=True, data={"message": "Document deleted successfully."})

