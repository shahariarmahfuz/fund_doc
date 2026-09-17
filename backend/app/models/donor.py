from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Donor(Base):
    __tablename__ = "Donor"

    id = Column(String, primary_key=True, default=generate_uuid)
    donorId = Column(String, unique=True, nullable=False, index=True)
    fullName = Column(String, nullable=False)
    mobile = Column(String, unique=True, nullable=False, index=True)
    address = Column(String, nullable=True)
    nationalId = Column(String, unique=True, nullable=True, index=True)
    notes = Column(String, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    documents = relationship("Document", back_populates="donor")
    campaignContributions = relationship("CampaignContribution", back_populates="donor")
    donations = relationship("LedgerTransaction", back_populates="donor")
