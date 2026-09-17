"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contributionAdjustmentSchema, type ContributionAdjustmentFormValues } from "../schema"
import { createContributionAdjustment } from "../ledger-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { SlidersHorizontal } from "lucide-react"

type MemberOption = {
  id: string
  memberId: string
  fullName: string | null
}

interface AddAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: MemberOption[]
  onSuccess?: () => void
}

export function AddAdjustmentDialog({ open, onOpenChange, members, onSuccess }: AddAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContributionAdjustmentFormValues>({
    resolver: zodResolver(contributionAdjustmentSchema),
    defaultValues: {
      memberId: "",
      adjustmentType: "CREDIT",
      amount: 100,
      paymentDate: today,
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  })

  const onSubmit = async (data: ContributionAdjustmentFormValues) => {
    setLoading(true)
    try {
      const res = await createContributionAdjustment(data)
      if (res.success) {
        toast.success("Contribution adjustment recorded successfully")
        reset()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error((res as any).error || "Failed to process adjustment")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="h-5 w-5" />
            Record Contribution Adjustment
          </DialogTitle>
          <DialogDescription>
            Record a credit (deposit) or debit (deduction) adjustment to reconcile past dues or balance differences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="memberId">Select Member *</Label>
            <Select
              value={watch("memberId")}
              onValueChange={(val) => setValue("memberId", val, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search or select member" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.memberId} - {m.fullName || "Member"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.memberId && <p className="text-xs text-destructive">{errors.memberId.message}</p>}
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Adjustment Type *</Label>
            <Select
              value={watch("adjustmentType")}
              onValueChange={(val: "CREDIT" | "DEBIT") => setValue("adjustmentType", val, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDIT">Credit (Deposit - Increases Balance)</SelectItem>
                <SelectItem value="DEBIT">Debit (Deduction - Decreases Balance)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              type="number"
              id="amount"
              min={1}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Date *</Label>
              <Input type="date" id="paymentDate" {...register("paymentDate")} />
              {errors.paymentDate && <p className="text-xs text-destructive">{errors.paymentDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={watch("paymentMethod")}
                onValueChange={(val) => setValue("paymentMethod", val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="MOBILE_BANKING">Mobile Banking</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference / Voucher No (Optional)</Label>
            <Input
              id="referenceNumber"
              placeholder="e.g. ADJ-2026-001"
              {...register("referenceNumber")}
            />
          </div>

          {/* Notes / Reason */}
          <div className="space-y-2">
            <Label htmlFor="notes">Adjustment Reason *</Label>
            <Input
              id="notes"
              placeholder="e.g. Reconciliation of past dues"
              {...register("notes")}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
