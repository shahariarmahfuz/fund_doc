from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Beneficiary(Base):
    __tablename__ = "Beneficiary"

    id = Column(String, primary_key=True, default=generate_uuid)
    beneficiaryId = Column(String, unique=True, nullable=False, index=True)
    memberId = Column(String, ForeignKey("Member.id", ondelete="SET NULL"), nullable=True, index=True)
    fullName = Column(String, nullable=False)

    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    address = Column(String, nullable=True)
    presentAddress = Column(String, nullable=True)
    permanentAddress = Column(String, nullable=True)
    nationalId = Column(String, unique=True, nullable=True, index=True)
    idDocumentType = Column(String, default="NID", nullable=True)
    fatherOrHusbandName = Column(String, nullable=True)
    beneficiaryPhoto = Column(String, nullable=True)
    nidOrBirthCertificate = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
    relationToMember = Column(String, nullable=True)

    assistanceType = Column(String, nullable=True)
    assistanceReason = Column(String, nullable=True)
    loanReason = Column(String, nullable=True)
    businessType = Column(String, nullable=True)
    loanPurpose = Column(String, nullable=True)
    loanAmount = Column(Integer, nullable=True)

    emergencyContactName = Column(String, nullable=True)
    emergencyContactRelation = Column(String, nullable=True)
    emergencyContactMobile = Column(String, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)

    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    member = relationship("Member", back_populates="beneficiaries")
    loans = relationship("Loan", back_populates="beneficiary")
    grants = relationship("Grant", back_populates="beneficiary")
    documents = relationship("Document", back_populates="beneficiary")
    beneficiaryPayments = relationship("BeneficiaryPayment", back_populates="beneficiary")
