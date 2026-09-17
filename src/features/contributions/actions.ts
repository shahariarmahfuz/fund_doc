"use server"

import { apiClient } from "@/lib/api/client"
import { contributionSchema, type ContributionFormValues, bulkContributionSchema, type BulkContributionFormValues } from "./schema"
import { revalidatePath } from "next/cache"

export async function createContribution(data: ContributionFormValues) {
  const parsed = contributionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data provided" }

  const pd = parsed.data

  try {
    const res = await apiClient.post<any>("/api/v1/contributions", {
      memberId: pd.memberId,
      month: pd.month,
      year: pd.year,
      amount: pd.amount,
      paymentDate: new Date(pd.paymentDate).toISOString(),
      paymentMethod: pd.paymentMethod,
      referenceNumber: pd.referenceNumber || undefined,
      notes: pd.notes || undefined,
      status: pd.status,
      isAdditional: pd.isAdditional,
    })

    revalidatePath("/contributions")
    revalidatePath(`/members/${pd.memberId}`)
    revalidatePath("/")
    return { success: true, ...res }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to process monthly contribution" }
  }
}

export async function getContributions() {
  try {
    return await apiClient.contributions.getAll()
  } catch (err) {
    console.error("Failed to fetch contributions:", err)
    return []
  }
}

export async function updateContribution(id: string, data: ContributionFormValues) {
  const parsed = contributionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data provided" }

  const pd = parsed.data

  try {
    await apiClient.delete(`/api/v1/contributions/${id}`)
    const res = await apiClient.post<any>("/api/v1/contributions", {
      memberId: pd.memberId,
      month: pd.month,
      year: pd.year,
      amount: pd.amount,
      paymentDate: new Date(pd.paymentDate).toISOString(),
      paymentMethod: pd.paymentMethod,
      referenceNumber: pd.referenceNumber || undefined,
      notes: pd.notes || undefined,
      status: pd.status,
      isAdditional: pd.isAdditional,
    })

    revalidatePath("/contributions")
    revalidatePath(`/members/${pd.memberId}`)
    revalidatePath("/")
    return { success: true, ...res }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update contribution" }
  }
}

export async function deleteContribution(id: string) {
  try {
    await apiClient.delete(`/api/v1/contributions/${id}`)
    revalidatePath("/")
    revalidatePath("/contributions")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete contribution" }
  }
}

export async function createBulkContribution(data: BulkContributionFormValues) {
  const parsed = bulkContributionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data provided" }
  const pd = parsed.data

  if (pd.fromYear > pd.toYear || (pd.fromYear === pd.toYear && pd.fromMonth > pd.toMonth)) {
    return { success: false, error: "Start month cannot be after end month" }
  }

  const targetMonths: { month: number; year: number }[] = []
  let curMonth = pd.fromMonth
  let curYear = pd.fromYear
  const endMonth = pd.toMonth
  const endYear = pd.toYear

  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    targetMonths.push({ month: curMonth, year: curYear })
    curMonth++
    if (curMonth > 12) {
      curMonth = 1
      curYear++
    }
  }

  try {
    let processedCount = 0
    for (const m of targetMonths) {
      const refNumber = pd.referenceNumber ? `${pd.referenceNumber}-${m.month}-${m.year}` : undefined
      await apiClient.post<any>("/api/v1/contributions", {
        memberId: pd.memberId,
        month: m.month,
        year: m.year,
        amount: pd.monthlyAmount,
        paymentDate: new Date(pd.paymentDate).toISOString(),
        paymentMethod: pd.paymentMethod,
        referenceNumber: refNumber,
        notes: pd.notes || undefined,
        status: "PAID",
        isAdditional: false,
      })
      processedCount++
    }

    revalidatePath("/contributions")
    revalidatePath(`/members/${pd.memberId}`)
    revalidatePath("/")

    return { success: true, count: processedCount }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to process bulk contributions" }
  }
}

export async function getMemberPaidMonths(memberId: string) {
  if (!memberId) return []
  try {
    const list = await apiClient.get<any[]>(`/api/v1/contributions?memberId=${memberId}&status=PAID`)
    return (list || []).filter((c) => !c.isAdditional).map((c) => `${c.month}-${c.year}`)
  } catch {
    return []
  }
}
