"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { Separator } from "@/components/ui/separator"
import type { DonationTransactionItem } from "../actions"
import { UserCheck, Users } from "lucide-react"

interface ViewDonationDialogProps {
  isOpen: boolean
  onClose: () => void
  donation: DonationTransactionItem | null
}

export function ViewDonationDialog({ isOpen, onClose, donation }: ViewDonationDialogProps) {
    if (!donation) return null

  const isMember = donation.sourceType === "MEMBER"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{"Donation Details"}</DialogTitle>
          <DialogDescription>
            {"Complete details and ledger reference of donations received."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-y-4 gap-x-8 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Donation Source *"}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {isMember ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{"Foundation Member"}</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="border-primary text-primary flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{"Non-member / Donor"}</span>
                </Badge>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {isMember ? "Foundation Member *" : "Donor"}
            </p>
            {isMember ? (
              <>
                <p className="font-semibold text-base text-foreground mt-0.5">{donation.member?.fullName || "Foundation Member"}</p>
                <p className="text-xs text-muted-foreground">{"ID:"} {donation.member?.memberId || donation.memberId}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-base text-foreground mt-0.5">{donation.donor?.fullName || "External Donor"}</p>
                {donation.donor && (
                  <>
                    <p className="text-xs text-muted-foreground">{"ID:"} {donation.donor.donorId}</p>
                    <p className="text-xs text-muted-foreground">{"Mobile:"} {donation.donor.mobile}</p>
                  </>
                )}
              </>
            )}
          </div>

          <Separator className="col-span-2 my-1" />

          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Selected Group"}</p>
            <p className="font-semibold text-base text-primary mt-0.5">{donation.groupName}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Voucher No"}</p>
            <p className="font-mono text-sm font-bold mt-1 bg-muted px-2 py-1 rounded text-primary w-fit">
              {donation.voucherNo}
            </p>
          </div>

          <Separator className="col-span-2 my-1" />

          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Amount"}</p>
            <p className="font-mono text-xl font-bold text-green-600 mt-0.5">
              ৳{donation.amount}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Date"}</p>
            <p className="font-medium text-sm mt-0.5">{formatDate(donation.date)}</p>
            <p className="text-xs text-muted-foreground">({new Date(donation.date).toLocaleDateString("bn-BD")})</p>
          </div>

          <Separator className="col-span-2 my-1" />

          <div>
            <p className="text-sm font-medium text-muted-foreground">{"Created By"}</p>
            <p className="font-medium text-sm mt-0.5">{donation.createdBy}</p>
            <p className="text-xs text-muted-foreground">{"Status:"}<Badge variant="outline" className="text-[10px] ml-1">{donation.status}</Badge></p>
          </div>

          <div className="col-span-2">
            <p className="text-sm font-medium text-muted-foreground">{"Remarks"}</p>
            <div className="mt-1 p-3 bg-muted/30 rounded border text-sm text-foreground">
              {donation.remarks || "No remarks"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
