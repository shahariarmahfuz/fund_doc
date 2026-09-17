from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Campaign(Base):
    __tablename__ = "Campaign"

    id = Column(String, primary_key=True, default=generate_uuid)
    campaignId = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    description = Column(String, nullable=True)
    targetAmount = Column(Integer, nullable=True)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)
    remarks = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    contributions = relationship("CampaignContribution", back_populates="campaign")
    beneficiaryPayments = relationship("BeneficiaryPayment", back_populates="campaign")
    documents = relationship("Document", back_populates="campaign")

class BeneficiaryPayment(Base):
    __tablename__ = "BeneficiaryPayment"

    id = Column(String, primary_key=True, default=generate_uuid)
    campaignId = Column(String, ForeignKey("Campaign.id", ondelete="RESTRICT"), nullable=False, index=True)
    beneficiaryId = Column(String, ForeignKey("Beneficiary.id", ondelete="RESTRICT"), nullable=False, index=True)
    ledgerTransactionId = Column(String, ForeignKey("LedgerTransaction.id", ondelete="RESTRICT"), unique=True, nullable=False)
    amount = Column(Integer, nullable=False)
    date = Column(DateTime, nullable=False)
    reason = Column(String, nullable=False)
    referenceNumber = Column(String, nullable=True)
    comments = Column(String, nullable=True)
    status = Column(String, default="COMPLETED", nullable=False)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    campaign = relationship("Campaign", back_populates="beneficiaryPayments")
    beneficiary = relationship("Beneficiary", back_populates="beneficiaryPayments")
    ledgerTransaction = relationship("LedgerTransaction", back_populates="beneficiaryPayment")
    documents = relationship("Document", back_populates="beneficiaryPayment")

class CampaignContribution(Base):
    __tablename__ = "CampaignContribution"

    id = Column(String, primary_key=True, default=generate_uuid)
    campaignId = Column(String, ForeignKey("Campaign.id", ondelete="RESTRICT"), nullable=False, index=True)
    memberId = Column(String, ForeignKey("Member.id", ondelete="SET NULL"), nullable=True, index=True)
    donorId = Column(String, ForeignKey("Donor.id", ondelete="SET NULL"), nullable=True, index=True)
    ledgerTransactionId = Column(String, ForeignKey("LedgerTransaction.id", ondelete="RESTRICT"), unique=True, nullable=False)
    amount = Column(Integer, nullable=False)
    date = Column(DateTime, nullable=False)
    remarks = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    campaign = relationship("Campaign", back_populates="contributions")
    member = relationship("Member", back_populates="campaignContributions")
    donor = relationship("Donor", back_populates="campaignContributions")
    ledgerTransaction = relationship("LedgerTransaction", back_populates="campaignContribution")
