import { z } from "zod"

export const expenseNameSchema = z.object({
  name: z.string().trim().min(1, "Expense name is required").max(150, "Expense name cannot exceed 150 characters"),
  note: z.string().max(1000, "Note cannot exceed 1000 characters").optional().default(""),
})

export type ExpenseNameFormValues = z.infer<typeof expenseNameSchema>


export const expenseSchema = z.object({
  groupId: z.string().trim().min(1, "Please select a funding Group"),
  nameMode: z.enum(["existing", "custom"]).default("existing"),
  expenseNameId: z.string().optional(),
  customName: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  comment: z.string().max(500, "Comment cannot exceed 500 characters").optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
}).superRefine((data, ctx) => {
  if (data.nameMode === "existing") {
    if (!data.expenseNameId || data.expenseNameId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select an existing Expense Name or switch to 'Use custom name'",
        path: ["expenseNameId"],
      })
    }
  } else {
    if (!data.customName || data.customName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a custom expense name",
        path: ["customName"],
      })
    }
  }
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
