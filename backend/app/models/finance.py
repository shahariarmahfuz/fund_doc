from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Fund(Base):
    __tablename__ = "Fund"

    id = Column(String, primary_key=True, default=generate_uuid)
    groupId = Column(String, ForeignKey("Group.id", ondelete="RESTRICT"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    group = relationship("Group", back_populates="funds")
    ledgerLines = relationship("LedgerEntry", back_populates="fund")
    allocations = relationship("FundAllocation", back_populates="fund")

class MonthlyContribution(Base):
    __tablename__ = "MonthlyContribution"

    id = Column(String, primary_key=True, default=generate_uuid)
    memberId = Column(String, ForeignKey("Member.id", ondelete="RESTRICT"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    expectedAmount = Column(Integer, nullable=False)
    isAdditional = Column(Boolean, default=False, nullable=False)
    status = Column(String, default="PENDING", nullable=False)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    member = relationship("Member", back_populates="contributions")
    payments = relationship("ContributionPayment", back_populates="monthlyContribution")

    __table_args__ = (
        UniqueConstraint("memberId", "month", "year", "isAdditional", name="MonthlyContribution_memberId_month_year_isAdditional_key"),
    )

class ContributionPayment(Base):
    __tablename__ = "ContributionPayment"

    id = Column(String, primary_key=True, default=generate_uuid)
    monthlyContributionId = Column(String, ForeignKey("MonthlyContribution.id", ondelete="RESTRICT"), nullable=False, index=True)
    ledgerTransactionId = Column(String, ForeignKey("LedgerTransaction.id", ondelete="RESTRICT"), unique=True, nullable=False)
    amount = Column(Integer, nullable=False)
    paymentDate = Column(DateTime, nullable=False)
    paymentMethod = Column(String, nullable=False)
    referenceNumber = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    monthlyContribution = relationship("MonthlyContribution", back_populates="payments")
    ledgerTransaction = relationship("LedgerTransaction", back_populates="contributionPayment")

class LedgerTransaction(Base):
    __tablename__ = "LedgerTransaction"

    id = Column(String, primary_key=True, default=generate_uuid)
    date = Column(DateTime, nullable=False)
    type = Column(String, nullable=False)
    referenceId = Column(String, nullable=True)
    memberId = Column(String, ForeignKey("Member.id", ondelete="SET NULL"), nullable=True, index=True)
    donorId = Column(String, ForeignKey("Donor.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String, default="COMPLETED", nullable=False)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    member = relationship("Member", back_populates="donations")
    donor = relationship("Donor", back_populates="donations")
    entries = relationship("LedgerEntry", back_populates="transaction", cascade="all, delete-orphan")
    contributionPayment = relationship("ContributionPayment", back_populates="ledgerTransaction", uselist=False)
    loanRepayment = relationship("LoanRepayment", back_populates="ledgerTransaction", uselist=False)
    campaignContribution = relationship("CampaignContribution", back_populates="ledgerTransaction", uselist=False)
    beneficiaryPayment = relationship("BeneficiaryPayment", back_populates="ledgerTransaction", uselist=False)

class LedgerEntry(Base):
    __tablename__ = "LedgerEntry"

    id = Column(String, primary_key=True, default=generate_uuid)
    transactionId = Column(String, ForeignKey("LedgerTransaction.id", ondelete="CASCADE"), nullable=False, index=True)
    fundId = Column(String, ForeignKey("Fund.id", ondelete="RESTRICT"), nullable=False, index=True)
    isCredit = Column(Boolean, nullable=False)
    amount = Column(Integer, nullable=False)
    groupId = Column(String, nullable=True)
    groupCode = Column(String, nullable=True)
    groupName = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    transaction = relationship("LedgerTransaction", back_populates="entries")
    fund = relationship("Fund", back_populates="ledgerLines")

class Loan(Base):
    __tablename__ = "Loan"

    id = Column(String, primary_key=True, default=generate_uuid)
    loanNumber = Column(String, unique=True, nullable=False, index=True)
    memberId = Column(String, ForeignKey("Member.id", ondelete="RESTRICT"), nullable=True, index=True)
    beneficiaryId = Column(String, ForeignKey("Beneficiary.id", ondelete="RESTRICT"), nullable=True, index=True)
    amount = Column(Integer, nullable=False)
    loanType = Column(String, default="OTHER", nullable=False)
    businessType = Column(String, nullable=True)
    purpose = Column(String, nullable=False)
    requestedDate = Column(DateTime, default=get_utc_now, nullable=False)
    disbursedDate = Column(DateTime, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)
    notes = Column(String, nullable=True)

    installmentType = Column(String, nullable=True)
    installmentAmount = Column(Integer, nullable=True)
    totalInstallments = Column(Integer, nullable=True)
    firstInstallmentDate = Column(DateTime, nullable=True)
    nextDueDate = Column(DateTime, nullable=True)
    totalPaidAmount = Column(Integer, default=0, nullable=False)
    remainingBalance = Column(Integer, default=0, nullable=False)

    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    member = relationship("Member", back_populates="loans")
    beneficiary = relationship("Beneficiary", back_populates="loans")
    allocations = relationship("FundAllocation", back_populates="loan", cascade="all, delete-orphan")
    repayments = relationship("LoanRepayment", back_populates="loan")
    documents = relationship("Document", back_populates="loan")

class LoanRepayment(Base):
    __tablename__ = "LoanRepayment"

    id = Column(String, primary_key=True, default=generate_uuid)
    loanId = Column(String, ForeignKey("Loan.id", ondelete="RESTRICT"), nullable=False, index=True)
    ledgerTransactionId = Column(String, ForeignKey("LedgerTransaction.id", ondelete="RESTRICT"), unique=True, nullable=False)
    amount = Column(Integer, nullable=False)
    date = Column(DateTime, nullable=False)
    status = Column(String, default="COMPLETED", nullable=False)

    installmentNo = Column(Integer, nullable=True)
    paymentMethod = Column(String, default="CASH", nullable=False)
    referenceNumber = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    collectedBy = Column(String, nullable=True)
    receiptUrl = Column(String, nullable=True)

    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    loan = relationship("Loan", back_populates="repayments")
    ledgerTransaction = relationship("LedgerTransaction", back_populates="loanRepayment")

class Grant(Base):
    __tablename__ = "Grant"

    id = Column(String, primary_key=True, default=generate_uuid)
    grantNumber = Column(String, unique=True, nullable=False, index=True)
    beneficiaryId = Column(String, ForeignKey("Beneficiary.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    purpose = Column(String, nullable=False)
    dateApproved = Column(DateTime, nullable=True)
    disbursedDate = Column(DateTime, nullable=True)
    status = Column(String, default="PENDING", nullable=False)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    beneficiary = relationship("Beneficiary", back_populates="grants")
    allocations = relationship("FundAllocation", back_populates="grant", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="grant")

class FundAllocation(Base):
    __tablename__ = "FundAllocation"

    id = Column(String, primary_key=True, default=generate_uuid)
    fundId = Column(String, ForeignKey("Fund.id", ondelete="RESTRICT"), nullable=False, index=True)
    targetType = Column(String, nullable=False)
    loanId = Column(String, ForeignKey("Loan.id", ondelete="CASCADE"), nullable=True, index=True)
    grantId = Column(String, ForeignKey("Grant.id", ondelete="CASCADE"), nullable=True, index=True)
    amount = Column(Integer, nullable=False)
    createdAt = Column(DateTime, default=get_utc_now, nullable=False)
    updatedAt = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
    createdBy = Column(String, nullable=True)
    updatedBy = Column(String, nullable=True)

    fund = relationship("Fund", back_populates="allocations")
    loan = relationship("Loan", back_populates="allocations")
    grant = relationship("Grant", back_populates="allocations")
