/**
 * Model definitions for frontend components and actions.
 * These pure TypeScript interfaces replace Prisma model imports.
 */

export interface Foundation {
  id: string
  name: string
  description?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
}

export interface Group {
  id: string
  foundationId?: string
  name: string
  code: string
  shortName?: string | null
  description?: string | null
  remarks?: string | null
  status: string
  isFoundationGroup?: boolean
  memberSignupEnabled?: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  members?: Member[]
}

export interface Member {
  id: string
  memberId: string
  groupId: string
  fullName?: string | null
  fatherName?: string | null
  motherName?: string | null
  gender?: string | null
  dob?: Date | string | null
  nationalId?: string | null
  idDocumentType?: string | null
  occupation?: string | null
  monthlyIncome?: number | null
  bloodGroup?: string | null
  mobile?: string | null
  altMobile?: string | null
  email?: string | null
  phone?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  emergencyContactName?: string | null
  emergencyContactMobile?: string | null
  emergencyContactRelation?: string | null
  joinDate?: Date | string | null
  status: string
  position?: string | null
  remarks?: string | null
  maritalStatus?: string | null
  education?: string | null
  workplace?: string | null
  designation?: string | null
  skills?: string | null
  reference?: string | null
  reasonForJoining?: string | null
  participation?: string | null
  declarationAccepted?: boolean
  memberType?: string | null
  paidUntilMonth?: number | null
  paidUntilYear?: number | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  group?: Group | null
  beneficiaries?: Beneficiary[]
  contributions?: MonthlyContribution[]
  documents?: Document[]
}

export interface Beneficiary {
  id: string
  beneficiaryId: string
  memberId?: string | null
  fullName: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  address?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  nationalId?: string | null
  idDocumentType?: string | null
  fatherOrHusbandName?: string | null
  beneficiaryPhoto?: string | null
  nidOrBirthCertificate?: string | null
  occupation?: string | null
  remarks?: string | null
  relationToMember?: string | null
  assistanceType?: string | null
  assistanceReason?: string | null
  loanReason?: string | null
  businessType?: string | null
  loanPurpose?: string | null
  loanAmount?: number | null
  emergencyContactName?: string | null
  emergencyContactRelation?: string | null
  emergencyContactMobile?: string | null
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  member?: Member | null
  documents?: Document[]
  beneficiaryPayments?: BeneficiaryPayment[]
  loans?: Loan[]
  grants?: Grant[]
}

export interface Donor {
  id: string
  donorId: string
  fullName: string
  mobile: string
  address?: string | null
  nationalId?: string | null
  notes?: string | null
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  documents?: Document[]
}

export interface Fund {
  id: string
  groupId?: string | null
  name: string
  description?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  group?: Group | null
}

export interface MonthlyContribution {
  id: string
  memberId: string
  month: number
  year: number
  expectedAmount: number
  isAdditional: boolean
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  member?: Member | null
  payments?: ContributionPayment[]
}

export interface ContributionPayment {
  id: string
  monthlyContributionId: string
  ledgerTransactionId?: string | null
  amount: number
  paymentDate: Date | string
  paymentMethod: string
  referenceNumber?: string | null
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  monthlyContribution?: MonthlyContribution | null
}

export interface FundAllocation {
  id: string
  fundId: string
  loanId?: string | null
  grantId?: string | null
  amount: number
  createdAt: Date | string
  updatedAt: Date | string
  fund?: Fund | null
}

export interface Loan {
  id: string
  loanNumber: string
  memberId?: string | null
  beneficiaryId?: string | null
  loanType?: string | null
  businessType?: string | null
  purpose: string
  amount: number
  remainingBalance: number
  totalPaidAmount: number
  installmentType?: string | null
  installmentAmount?: number | null
  totalInstallments?: number | null
  firstInstallmentDate?: Date | string | null
  dateApproved?: Date | string | null
  dateDisbursed?: Date | string | null
  dueDate?: Date | string | null
  status: string
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  beneficiary?: Beneficiary | null
  member?: Member | null
  allocations?: FundAllocation[]
  repayments?: LoanRepayment[]
  documents?: Document[]
}

export interface LoanRepayment {
  id: string
  loanId: string
  ledgerTransactionId?: string | null
  amount: number
  date: Date | string
  paymentMethod: string
  referenceNumber?: string | null
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  loan?: Loan | null
}

export interface Grant {
  id: string
  grantNumber: string
  beneficiaryId: string
  amount: number
  purpose: string
  dateApproved?: Date | string | null
  disbursedDate?: Date | string | null
  status: string
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  beneficiary?: Beneficiary | null
  allocations?: FundAllocation[]
}

// Terminology aliases
export type Sadaqah = Grant
export type QardHasan = Loan
export type QardHasanRepayment = LoanRepayment

export interface BeneficiaryPayment {
  id: string
  beneficiaryId: string
  ledgerTransactionId?: string | null
  amount: number
  date: Date | string
  reason: string
  referenceNumber?: string | null
  comments?: string | null
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  beneficiary?: Beneficiary | null
}

export interface Document {
  id: string
  title: string
  type?: string | null
  documentType?: string | null
  fileUrl?: string | null
  secureUrl: string
  publicId?: string | null
  fileSize?: number | null
  sizeBytes?: number | null
  mimeType?: string | null
  memberId?: string | null
  beneficiaryId?: string | null
  donorId?: string | null
  loanId?: string | null
  groupId?: string | null
  foundationId?: string | null
  categoryId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
}

export interface DocumentCategory {
  id: string
  name: string
  description?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Role {
  id: string
  name: string
  description?: string | null
  isSystem?: boolean
  createdAt: Date | string
  updatedAt: Date | string
  permissions?: RolePermission[]
}

export interface Permission {
  id: string
  module: string
  action: string
  description?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  permission?: Permission
}

export interface User {
  id: string
  name: string
  username: string
  email?: string | null
  mobile?: string | null
  status: string
  roleId: string
  photo?: string | null
  preferences?: string | null
  lastLogin?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  role?: Role | null
}

export interface MemberRequest {
  id: string
  applicationNumber: string
  groupId?: string | null
  fullName: string
  fatherName?: string | null
  motherName?: string | null
  gender?: string | null
  dob?: Date | string | null
  nationalId?: string | null
  occupation?: string | null
  monthlyIncome?: number | null
  bloodGroup?: string | null
  mobile: string
  altMobile?: string | null
  email?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  emergencyContactName?: string | null
  emergencyContactMobile?: string | null
  emergencyContactRelation?: string | null
  referenceName?: string | null
  referenceMobile?: string | null
  referenceRelation?: string | null
  status: string
  adminMessage?: string | null
  rejectionReason?: string | null
  documents?: string | null
  submittedAt: Date | string
  reviewedAt?: Date | string | null
  reviewedBy?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface LedgerTransaction {
  id: string
  date: Date | string
  type: string
  referenceId?: string | null
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
  entries?: LedgerEntry[]
}

export interface LedgerEntry {
  id: string
  ledgerTransactionId: string
  fundId: string
  isCredit: boolean
  amount: number
  createdAt: Date | string
  updatedAt: Date | string
  fund?: Fund | null
}

export interface AuditLog {
  id: string
  userId?: string | null
  action: string
  module: string
  referenceId?: string | null
  remarks?: string | null
  ipAddress?: string | null
  device?: string | null
  browser?: string | null
  createdAt: Date | string
  user?: User | null
}

export interface ExpenseName {
  id: string
  name: string
  note?: string | null
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  updatedBy?: string | null
}

export interface Expense {
  id: string
  expenseId?: string | null
  groupId: string
  groupName?: string | null
  ledgerTransactionId?: string | null
  expenseNameId?: string | null
  customName?: string | null
  resolvedExpenseName: string
  amount: number
  comment?: string | null
  note?: string | null
  expenseDate: Date | string
  isDeleted: boolean
  deletedAt?: Date | string | null
  deletedBy?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string | null
  creatorName?: string | null
  expenseName?: ExpenseName | null
  group?: Group | null
}

export interface ExpenseReportCategoryBreakdown {
  name: string
  amount: number
  count: number
  percentage: number
}

export interface ExpenseReportGroupBreakdown {
  groupId: string
  groupName: string
  amount: number
  count: number
  percentage: number
}

export interface ExpenseReportDateBreakdown {
  date: string
  amount: number
  count: number
}

export interface ExpenseReportData {
  items: Expense[]
  totalAmount: number
  totalCount: number
  breakdown?: ExpenseReportCategoryBreakdown[]
  groupBreakdown?: ExpenseReportGroupBreakdown[]
  dateBreakdown?: ExpenseReportDateBreakdown[]
  startDate?: string | null
  endDate?: string | null
  groupId?: string | null
  expenseNameId?: string | null
}

export interface ExpenseLedgerItem {
  id: string
  date: Date | string
  expenseName: string
  groupId?: string | null
  groupName?: string | null
  comment?: string | null
  debit: number
  createdAt: Date | string
  createdBy?: string | null
  creatorName?: string | null
}

export interface ExpenseLedgerData {
  items: ExpenseLedgerItem[]
  totalAmount: number
  total: number
  page: number
  pageSize: number
  totalPages: number
}

