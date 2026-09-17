"use server"

import { revalidatePath } from "next/cache"
import { apiClient } from "@/lib/api/client"
import {
  expenseNameSchema,
  expenseSchema,
  type ExpenseNameFormValues,
  type ExpenseFormValues,
} from "./schema"
import type {
  ExpenseName,
  Expense,
  ExpenseReportData,
  ExpenseLedgerData,
} from "@/types/models"

export async function createExpenseName(data: ExpenseNameFormValues) {
  const parsed = expenseNameSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid expense name",
    }
  }

  try {
    const created = await apiClient.expenseNames.create({
      name: parsed.data.name,
      expense_name: parsed.data.name,
      note: parsed.data.note ? parsed.data.note.trim() : undefined,
    })
    revalidatePath("/expenses/names")
    revalidatePath("/expenses/new")
    return { success: true, data: created }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create expense name" }
  }
}


export async function updateExpenseName(id: string, data: { name?: string; note?: string; isActive?: boolean }) {
  try {
    const updated = await apiClient.expenseNames.update(id, data)
    revalidatePath("/expenses/names")
    revalidatePath("/expenses/names/manage")
    revalidatePath("/expenses/new")
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update expense name" }
  }
}

export async function deleteExpenseName(id: string) {
  try {
    await apiClient.expenseNames.delete(id)
    revalidatePath("/expenses/names")
    revalidatePath("/expenses/names/manage")
    revalidatePath("/expenses/new")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete expense name" }
  }
}

export async function getExpenseNames(activeOnly: boolean = false): Promise<ExpenseName[]> {
  try {
    return await apiClient.expenseNames.getAll(activeOnly)
  } catch (error) {
    console.error("Failed to fetch expense names:", error)
    return []
  }
}

export async function getGroupBalance(groupId: string) {
  try {
    const res = await apiClient.groups.getBalance(groupId)
    return { success: true, data: res }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch group balance" }
  }
}

export async function createExpense(data: ExpenseFormValues) {
  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid expense data",
    }
  }

  const pd = parsed.data
  try {
    const created = await apiClient.expenses.create({
      groupId: pd.groupId,
      expenseNameId: pd.nameMode === "existing" ? pd.expenseNameId : null,
      customName: pd.nameMode === "custom" ? pd.customName : null,
      amount: pd.amount,
      comment: pd.comment || "",
      expenseDate: new Date(pd.expenseDate).toISOString(),
    })

    revalidatePath("/expenses")
    revalidatePath("/expenses/manage")
    revalidatePath("/expenses/reports")
    revalidatePath("/expenses/ledger")
    return { success: true, data: created }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to record expense" }
  }
}

export async function updateExpense(id: string, data: ExpenseFormValues) {
  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid expense data",
    }
  }

  const pd = parsed.data
  try {
    const updated = await apiClient.expenses.update(id, {
      groupId: pd.groupId,
      expenseNameId: pd.nameMode === "existing" ? pd.expenseNameId : null,
      customName: pd.nameMode === "custom" ? pd.customName : null,
      amount: pd.amount,
      comment: pd.comment || "",
      expenseDate: new Date(pd.expenseDate).toISOString(),
    })

    revalidatePath("/expenses")
    revalidatePath("/expenses/manage")
    revalidatePath(`/expenses/${id}/edit`)
    revalidatePath("/expenses/reports")
    revalidatePath("/expenses/ledger")
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update expense" }
  }
}

export async function deleteExpense(id: string) {
  try {
    await apiClient.expenses.delete(id)
    revalidatePath("/expenses")
    revalidatePath("/expenses/manage")
    revalidatePath("/expenses/reports")
    revalidatePath("/expenses/ledger")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete expense" }
  }
}

export async function getExpenses(params?: {
  search?: string
  expenseNameId?: string
  groupId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}): Promise<{
  items: Expense[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  totalAmount: number
}> {
  try {
    return await apiClient.expenses.getAll(params)
  } catch (error) {
    console.error("Failed to fetch expenses:", error)
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: params?.pageSize || 10,
      totalPages: 1,
      totalAmount: 0,
    }
  }
}

export async function getExpense(id: string): Promise<Expense | null> {
  try {
    return await apiClient.expenses.getById(id)
  } catch (error) {
    console.error(`Failed to fetch expense ${id}:`, error)
    return null
  }
}

export async function getExpenseReport(params?: {
  startDate?: string
  endDate?: string
  fromDate?: string
  toDate?: string
  expenseNameId?: string
  groupId?: string
}): Promise<ExpenseReportData> {
  try {
    return await apiClient.expenses.getReport(params)
  } catch (error) {
    console.error("Failed to fetch expense report:", error)
    return {
      items: [],
      totalAmount: 0,
      totalCount: 0,
      breakdown: [],
      groupBreakdown: [],
      dateBreakdown: [],
      startDate: params?.startDate || params?.fromDate,
      endDate: params?.endDate || params?.toDate,
      groupId: params?.groupId,
      expenseNameId: params?.expenseNameId,
    }
  }
}

export async function getExpenseLedger(params?: {
  startDate?: string
  endDate?: string
  expenseNameId?: string
  groupId?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<ExpenseLedgerData> {
  try {
    return await apiClient.expenses.getLedger(params)
  } catch (error) {
    console.error("Failed to fetch expense ledger:", error)
    return {
      items: [],
      totalAmount: 0,
      total: 0,
      page: 1,
      pageSize: params?.pageSize || 50,
      totalPages: 1,
    }
  }
}
