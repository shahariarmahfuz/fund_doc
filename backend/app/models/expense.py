from sqlalchemy import Column, String, DateTime, Boolean, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class ExpenseName(Base):
    __tablename__ = "ExpenseName"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    note = Column(String, nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)


    expenses = relationship("Expense", back_populates="expenseName")

class Expense(Base):
    __tablename__ = "Expense"

    id = Column(String, primary_key=True, default=generate_uuid)
    expenseId = Column(String, nullable=True, index=True)
    groupId = Column(String, ForeignKey("Group.id", ondelete="RESTRICT"), nullable=False, index=True)
    expenseNameId = Column(String, ForeignKey("ExpenseName.id", ondelete="SET NULL"), nullable=True, index=True)
    customName = Column(String, nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    comment = Column(String, nullable=True)
    expenseDate = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    isDeleted = Column(Boolean, default=False, nullable=False, index=True)
    deletedAt = Column(DateTime, nullable=True)
    deletedBy = Column(String, nullable=True)
    ledgerTransactionId = Column(String, ForeignKey("LedgerTransaction.id", ondelete="SET NULL"), nullable=True, index=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    expenseName = relationship("ExpenseName", back_populates="expenses")
    group = relationship("Group", foreign_keys=[groupId])
    ledgerTransaction = relationship("LedgerTransaction", foreign_keys=[ledgerTransactionId])
