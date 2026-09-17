from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Member(Base):
    __tablename__ = "Member"

    id = Column(String, primary_key=True, default=generate_uuid)
    memberId = Column(String, unique=True, nullable=False, index=True)
    groupId = Column(String, ForeignKey("Group.id", ondelete="RESTRICT"), nullable=False, index=True)
    fullName = Column(String, nullable=True)

    # Personal Information
    fatherName = Column(String, nullable=True)
    motherName = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    dob = Column(DateTime, nullable=True)
    nationalId = Column(String, unique=True, nullable=True, index=True)
    idDocumentType = Column(String, default="NID", nullable=True)
    occupation = Column(String, nullable=True)
    monthlyIncome = Column(Integer, nullable=True)
    bloodGroup = Column(String, nullable=True)

    # Contact Information
    mobile = Column(String, unique=True, nullable=True, index=True)
    altMobile = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=True, index=True)
    phone = Column(String, nullable=True)
    presentAddress = Column(String, nullable=True)
    permanentAddress = Column(String, nullable=True)

    # Emergency Contact
    emergencyContactName = Column(String, nullable=True)
    emergencyContactMobile = Column(String, nullable=True)
    emergencyContactRelation = Column(String, nullable=True)

    # Organization Information
    joinDate = Column(DateTime, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)
    position = Column(String, default="GENERAL_MEMBER", nullable=True)
    remarks = Column(String, nullable=True)

    # Extended Information
    maritalStatus = Column(String, nullable=True)
    education = Column(String, nullable=True)
    workplace = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    skills = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    reasonForJoining = Column(String, nullable=True)
    participation = Column(String, nullable=True)
    declarationAccepted = Column(Boolean, default=True, nullable=False)
    memberType = Column(String, default="REGULAR", nullable=True)

    # Outstanding and Dues
    paidUntilMonth = Column(Integer, nullable=True)
    paidUntilYear = Column(Integer, nullable=True)

    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    group = relationship("Group", back_populates="members")
    beneficiaries = relationship("Beneficiary", back_populates="member")
    contributions = relationship("MonthlyContribution", back_populates="member")
    campaignContributions = relationship("CampaignContribution", back_populates="member")
    loans = relationship("Loan", back_populates="member")
    documents = relationship("Document", back_populates="member")
    statusHistory = relationship("MemberStatusHistory", back_populates="member", cascade="all, delete-orphan")
    donations = relationship("LedgerTransaction", back_populates="member")

class MemberStatusHistory(Base):
    __tablename__ = "MemberStatusHistory"

    id = Column(String, primary_key=True, default=generate_uuid)
    memberId = Column(String, ForeignKey("Member.id", ondelete="CASCADE"), nullable=False, index=True)
    fromStatus = Column(String, nullable=False)
    toStatus = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    changedBy = Column(String, nullable=True)
    changedAt = Column(DateTime, default=get_utc_now, nullable=False)

    member = relationship("Member", back_populates="statusHistory")
