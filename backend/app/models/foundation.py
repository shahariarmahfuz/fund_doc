from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Foundation(Base):
    __tablename__ = "Foundation"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    groups = relationship("Group", back_populates="foundation", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="foundation")

class Group(Base):
    __tablename__ = "Group"

    id = Column(String, primary_key=True, default=generate_uuid)
    foundationId = Column(String, ForeignKey("Foundation.id", ondelete="RESTRICT"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False, index=True)
    shortName = Column(String, nullable=True)
    description = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)
    isFoundationGroup = Column(Boolean, default=False, nullable=False, index=True)
    memberSignupEnabled = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    foundation = relationship("Foundation", back_populates="groups")
    members = relationship("Member", back_populates="group")
    funds = relationship("Fund", back_populates="group")
    documents = relationship("Document", back_populates="group")
