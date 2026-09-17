from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class DocumentCategory(Base):
    __tablename__ = "DocumentCategory"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    documents = relationship("Document", back_populates="category")

class Document(Base):
    __tablename__ = "Document"

    id = Column(String, primary_key=True, default=generate_uuid)
    documentNumber = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    categoryId = Column(String, ForeignKey("DocumentCategory.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String, nullable=False)
    cloudinaryPublicId = Column(String, nullable=False)
    secureUrl = Column(String, nullable=False)
    originalFilename = Column(String, nullable=False)
    mimeType = Column(String, nullable=False)
    sizeBytes = Column(Integer, nullable=False)
    resourceType = Column(String, default="auto", nullable=False)
    targetType = Column(String, nullable=False, index=True)
    entityId = Column(String, nullable=True)

    description = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)

    foundationId = Column(String, ForeignKey("Foundation.id", ondelete="CASCADE"), nullable=True, index=True)
    groupId = Column(String, ForeignKey("Group.id", ondelete="CASCADE"), nullable=True, index=True)
    memberId = Column(String, ForeignKey("Member.id", ondelete="CASCADE"), nullable=True, index=True)
    beneficiaryId = Column(String, ForeignKey("Beneficiary.id", ondelete="CASCADE"), nullable=True, index=True)
    loanId = Column(String, ForeignKey("Loan.id", ondelete="CASCADE"), nullable=True, index=True)
    grantId = Column(String, ForeignKey("Grant.id", ondelete="CASCADE"), nullable=True, index=True)
    donorId = Column(String, ForeignKey("Donor.id", ondelete="CASCADE"), nullable=True, index=True)
    campaignId = Column(String, ForeignKey("Campaign.id", ondelete="CASCADE"), nullable=True, index=True)
    beneficiaryPaymentId = Column(String, ForeignKey("BeneficiaryPayment.id", ondelete="CASCADE"), nullable=True, index=True)

    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    category = relationship("DocumentCategory", back_populates="documents")
    foundation = relationship("Foundation", back_populates="documents")
    group = relationship("Group", back_populates="documents")
    member = relationship("Member", back_populates="documents")
    beneficiary = relationship("Beneficiary", back_populates="documents")
    loan = relationship("Loan", back_populates="documents")
    grant = relationship("Grant", back_populates="documents")
    donor = relationship("Donor", back_populates="documents")
    campaign = relationship("Campaign", back_populates="documents")
    beneficiaryPayment = relationship("BeneficiaryPayment", back_populates="documents")
