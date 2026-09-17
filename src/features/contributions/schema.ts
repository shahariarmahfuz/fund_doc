import { z } from "zod"

export const contributionSchema = z.object({
  memberId: z.string().min(1, "Member selection is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  amount: z.number().min(1, "Minimum contribution amount is 1"),
  paymentDate: z.string().min(1, "Payment date is required"), // YYYY-MM-DD
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "CANCELLED"]),
  isAdditional: z.boolean(),
})

export type ContributionFormValues = z.infer<typeof contributionSchema>

export const bulkContributionSchema = z.object({
  memberId: z.string().min(1, "Member selection is required"),
  fromMonth: z.number().min(1).max(12),
  fromYear: z.number().min(2000).max(2100),
  toMonth: z.number().min(1).max(12),
  toYear: z.number().min(2000).max(2100),
  monthlyAmount: z.number().min(1, "Minimum monthly amount is 1"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

export type BulkContributionFormValues = z.infer<typeof bulkContributionSchema>

export const contributionRefundSchema = z.object({
  memberId: z.string().min(1, "Member selection is required"),
  amount: z.number().min(1, "Refund amount must be greater than 0"),
  paymentDate: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().min(1, "Please specify refund reason/reference"),
})

export type ContributionRefundFormValues = z.infer<typeof contributionRefundSchema>

export const contributionAdjustmentSchema = z.object({
  memberId: z.string().min(1, "Member selection is required"),
  adjustmentType: z.enum(["CREDIT", "DEBIT"]),
  amount: z.number().min(1, "Adjustment amount must be greater than 0"),
  paymentDate: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().min(1, "Please specify adjustment reason"),
})

export type ContributionAdjustmentFormValues = z.infer<typeof contributionAdjustmentSchema>
