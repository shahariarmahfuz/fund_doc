import { z } from "zod"

export const grantAllocationSchema = z.object({
  groupId: z.string().min(1, "Please select a group"),
  amount: z.coerce.number().positive("Amount must be positive"),
})

export const grantSchema = z.object({
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  grantDate: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Sadaqah amount must be positive"),
  grantReason: z.string().min(1, "Reason for Sadaqah is required"),
  comment: z.string().optional(),
  allocations: z.array(grantAllocationSchema).min(1, "Select at least one funding group"),
}).refine(data => {
  const totalAllocated = data.allocations.reduce((sum, a) => sum + a.amount, 0)
  return totalAllocated === data.amount
}, {
  message: "Total allocations must match the Sadaqah amount",
  path: ["allocations"]
})

export type GrantFormValues = z.infer<typeof grantSchema>
export const sadaqahSchema = grantSchema
export type SadaqahFormValues = GrantFormValues
