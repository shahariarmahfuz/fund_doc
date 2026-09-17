import { z } from "zod"

export const loanSchema = z.object({
  beneficiaryId: z.string().min(1, "loans.validation.required"),
  loanType: z.enum(["BUSINESS", "EDUCATION", "MEDICAL", "AGRICULTURE", "EMERGENCY", "HOUSING", "OTHER"]),
  businessType: z.string().optional(),
  purpose: z.string().optional(),
  amount: z.number().min(1, "loans.validation.minAmount"),
  notes: z.string().optional(),
  
  // Installment Details
  installmentType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).optional(),
  installmentAmount: z.number().optional(),
  totalInstallments: z.number().optional(),
  firstInstallmentDate: z.date().optional(),
  
  isMultiGroup: z.boolean(),
  fundAllocations: z.array(z.object({
    groupId: z.string().min(1, "loans.validation.required"),
    amount: z.number().min(1, "loans.validation.minAmount")
  })).min(1, "loans.validation.required")

}).superRefine((data, ctx) => {
  if (data.loanType === "BUSINESS") {
    if (!data.businessType || data.businessType.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessType"],
        message: "loans.validation.required",
      });
    }
    if (!data.purpose || data.purpose.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purpose"],
        message: "loans.validation.required",
      });
    }
  } else {
    // For any non-business type, purpose (Reason) is required
    if (!data.purpose || data.purpose.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purpose"],
        message: "loans.validation.required",
      });
    }
  }

  const totalAllocated = data.fundAllocations?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  if (totalAllocated !== data.amount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fundAllocations"],
      message: "loans.validation.fundMismatch",
    });
  }
});

export type LoanFormValues = z.infer<typeof loanSchema>
export const qardHasanSchema = loanSchema
export type QardHasanFormValues = LoanFormValues
