from sqlalchemy import Column, String, DateTime, Index
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Settings(Base):
    __tablename__ = "Settings"

    id = Column(String, primary_key=True, default=generate_uuid)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

class SystemSettings(Base):
    __tablename__ = "SystemSettings"

    id = Column(String, primary_key=True, default=generate_uuid)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=False)
    group = Column(String, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    updatedBy = Column(String, nullable=True)

class FoundationProfile(Base):
    __tablename__ = "FoundationProfile"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    registrationNumber = Column(String, nullable=True)
    description = Column(String, nullable=True)
    currency = Column(String, default="USD", nullable=False)
    timezone = Column(String, default="UTC", nullable=False)
    language = Column(String, default="en", nullable=False)
    status = Column(String, default="ACTIVE", nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    updatedBy = Column(String, nullable=True)
