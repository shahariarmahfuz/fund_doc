from sqlalchemy import Column, String, DateTime, Integer, Index
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class MemberRequest(Base):
    __tablename__ = "MemberRequest"

    id = Column(String, primary_key=True, default=generate_uuid)
    applicationNumber = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, default="PENDING", nullable=False, index=True)

    # Personal Information
    fullName = Column(String, nullable=False)
    fatherName = Column(String, nullable=True)
    motherName = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    nationalId = Column(String, nullable=True)
    idDocumentType = Column(String, default="NID", nullable=True)
    occupation = Column(String, nullable=True)
    monthlyIncome = Column(Integer, nullable=True)
    bloodGroup = Column(String, nullable=True)
    education = Column(String, nullable=True)
    maritalStatus = Column(String, nullable=True)

    # Contact Information
    mobile = Column(String, nullable=True)
    altMobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    presentAddress = Column(String, nullable=True)
    permanentAddress = Column(String, nullable=True)

    # Emergency Contact
    emergencyContactName = Column(String, nullable=True)
    emergencyContactMobile = Column(String, nullable=True)
    emergencyContactRelation = Column(String, nullable=True)

    # Reference / Nominee
    referenceName = Column(String, nullable=True)
    referenceMobile = Column(String, nullable=True)
    referenceRelation = Column(String, nullable=True)

    # Organization
    groupId = Column(String, nullable=True)
    reasonForJoining = Column(String, nullable=True)

    # Documents stored as JSON string
    documents = Column(String, nullable=True)

    # Admin workflow
    rejectionReason = Column(String, nullable=True)
    adminMessage = Column(String, nullable=True)
    approvedAt = Column(DateTime, nullable=True)
    approvedBy = Column(String, nullable=True)
    createdMemberId = Column(String, nullable=True)

    submittedAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
