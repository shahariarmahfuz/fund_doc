"use server"

import { apiClient } from "@/lib/api/client"
import { loanSchema, type LoanFormValues } from "./schema"
import { revalidatePath } from "next/cache"

export async function getLoans() {
  try {
    return await apiClient.loans.getAll()
  } catch (err) {
    console.error("Failed to fetch loans:", err)
    return []
  }
}

export async function getLoan(id: string) {
  try {
    return await apiClient.loans.getById(id)
  } catch (err) {
    console.error(`Failed to fetch loan ${id}:`, err)
    return null
  }
}

export async function createLoanRequest(data: LoanFormValues) {
  const parsed = loanSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data" }
  const pd = parsed.data

  const calculatedInstallment = (pd.totalInstallments && pd.totalInstallments > 0)
    ? Math.floor(pd.amount / pd.totalInstallments)
    : (pd.installmentAmount || pd.amount)

  try {
    const loan = await apiClient.loans.create({
      beneficiaryId: pd.beneficiaryId,
      loanType: pd.loanType,
      businessType: pd.loanType === "BUSINESS" ? pd.businessType : null,
      amount: pd.amount,
      purpose: pd.purpose || "",
      installmentType: pd.installmentType,
      installmentAmount: calculatedInstallment,
      totalInstallments: pd.totalInstallments,
      firstInstallmentDate: pd.firstInstallmentDate ? new Date(pd.firstInstallmentDate).toISOString() : undefined,
      notes: pd.notes,
      fundAllocations: pd.fundAllocations || [],
    })

    revalidatePath("/loans")
    return { success: true, data: loan }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create loan" }
  }
}

export async function editLoanRequest(id: string, data: LoanFormValues) {
  const parsed = loanSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data" }
  const pd = parsed.data

  const calculatedInstallment = (pd.totalInstallments && pd.totalInstallments > 0)
    ? Math.floor(pd.amount / pd.totalInstallments)
    : (pd.installmentAmount || pd.amount)

  try {
    const loan = await apiClient.loans.update(id, {
      beneficiaryId: pd.beneficiaryId,
      loanType: pd.loanType,
      businessType: pd.loanType === "BUSINESS" ? pd.businessType : null,
      amount: pd.amount,
      purpose: pd.purpose || "",
      installmentType: pd.installmentType,
      installmentAmount: calculatedInstallment,
      totalInstallments: pd.totalInstallments,
      firstInstallmentDate: pd.firstInstallmentDate ? new Date(pd.firstInstallmentDate).toISOString() : undefined,
      notes: pd.notes,
    })

    revalidatePath(`/loans/${id}`)
    revalidatePath("/loans")
    return { success: true, data: loan }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update loan" }
  }
}

export async function repayLoan(
  loanId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber: string,
  installmentNo?: number,
  notes?: string,
  collectedBy?: string,
  paymentDate?: Date,
  receiptUrl?: string
) {
  try {
    const isoDate = paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString()
    await apiClient.loans.repay(loanId, {
      loanId,
      amount,
      paymentMethod,
      referenceNumber,
      installmentNo,
      notes,
      collectedBy,
      date: isoDate,
      paymentDate: isoDate,
      receiptUrl,
    })

    revalidatePath(`/loans/${loanId}`)
    revalidatePath("/loans")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to process repayment" }
  }
}

export async function deleteLoanAction(id: string) {
  try {
    await apiClient.loans.delete(id)
    revalidatePath("/loans")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete loan" }
  }
}
