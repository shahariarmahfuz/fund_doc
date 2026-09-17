"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatShortMonth } from "@/lib/format"
import { Separator } from "@/components/ui/separator"

interface ViewContributionDialogProps {
  isOpen: boolean
  onClose: () => void
  contribution: any
}

export function ViewContributionDialog({ isOpen, onClose, contribution }: ViewContributionDialogProps) {
      if (!contribution) return null

  const payment = contribution.payments?.[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{"Contribution Details"}</DialogTitle>
          <DialogDescription>
            {"Detailed information about this contribution"}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-y-4 gap-x-8 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Member"}</p>
            <p className="font-medium">{contribution.member.fullName}</p>
            <p className="text-xs text-muted-foreground">{contribution.member.memberId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Group"}</p>
            <p className="font-medium">{contribution.member.group?.name}</p>
            <p className="text-xs text-muted-foreground">{contribution.member.group?.code}</p>
          </div>

          <Separator className="col-span-2 my-2" />

          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Period"}</p>
            <p className="font-medium">{formatShortMonth(contribution.month - 1)} {contribution.year}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Type"}</p>
            <p className="font-medium">{contribution.isAdditional ? "Additional Payment" : "Monthly Standard"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Expected Amount"}</p>
            <p className="font-medium text-lg">৳{contribution.expectedAmount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Status"}</p>
            <Badge variant={contribution.status === "PAID" ? "default" : "destructive"} className="mt-1">
              {contribution.status === "PAID" ? "Paid" : contribution.status === "PENDING" ? "Pending" : "Cancelled"}
            </Badge>
          </div>

          <Separator className="col-span-2 my-2" />

          {payment ? (
            <>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{"Payment Amount"}</p>
                <p className="font-medium text-lg text-green-600">৳{payment.amount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{"Payment Date"}</p>
                <p className="font-medium">{formatDate(payment.paymentDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{"Payment Method"}</p>
                <p className="font-medium">{payment.paymentMethod === "CASH" ? "Cash" : payment.paymentMethod === "BANK" ? "Bank Transfer" : payment.paymentMethod === "BKASH" ? "bKash" : payment.paymentMethod === "NAGAD" ? "Nagad" : "Mobile Money (bKash/Nagad)"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{"Reference / TrxID"}</p>
                <p className="font-medium">{payment.referenceNumber || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">{"Notes / Remarks"}</p>
                <p className="font-medium text-sm mt-1 bg-muted p-3 rounded-md">{payment.notes || "No notes provided."}</p>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-sm font-medium text-muted-foreground">{"Ledger Transaction ID"}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">{payment.ledgerTransactionId}</p>
              </div>
            </>
          ) : (
            <div className="col-span-2 text-center py-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">{"No payments recorded for this contribution."}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
