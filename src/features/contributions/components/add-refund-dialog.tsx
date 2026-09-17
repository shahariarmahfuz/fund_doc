"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contributionRefundSchema, type ContributionRefundFormValues } from "../schema"
import { createContributionRefund } from "../ledger-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { RotateCcw } from "lucide-react"

type MemberOption = {
  id: string
  memberId: string
  fullName: string | null
}

interface AddRefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: MemberOption[]
  onSuccess?: () => void
}

export function AddRefundDialog({ open, onOpenChange, members, onSuccess }: AddRefundDialogProps) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContributionRefundFormValues>({
    resolver: zodResolver(contributionRefundSchema),
    defaultValues: {
      memberId: "",
      amount: 100,
      paymentDate: today,
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  })

  const onSubmit = async (data: ContributionRefundFormValues) => {
    setLoading(true)
    try {
      const res = await createContributionRefund(data)
      if (res.success) {
        toast.success("Contribution refund recorded successfully")
        reset()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error((res as any).error || "Failed to process refund")
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
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <RotateCcw className="h-5 w-5" />
            Record Contribution Refund
          </DialogTitle>
          <DialogDescription>
            Record a refund returned to a member. This will be recorded as a debit entry in the ledger.
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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Refund Amount *</Label>
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
              placeholder="e.g. RFD-2026-001"
              {...register("referenceNumber")}
            />
          </div>

          {/* Notes / Reason */}
          <div className="space-y-2">
            <Label htmlFor="notes">Refund Reason / Notes *</Label>
            <Input
              id="notes"
              placeholder="e.g. Refund for duplicate payment"
              {...register("notes")}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Saving..." : "Save Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
