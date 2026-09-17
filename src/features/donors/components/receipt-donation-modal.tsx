"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, X, Building, CheckCircle2, HeartHandshake, UserCheck, Users } from "lucide-react"
import { formatDate } from "@/lib/format"
import type { DonationTransactionItem } from "../actions"

interface ReceiptDonationModalProps {
  isOpen: boolean
  onClose: () => void
  donation: DonationTransactionItem | null
  mode?: "print" | "pdf"
}

export function ReceiptDonationModal({ isOpen, onClose, donation, mode = "print" }: ReceiptDonationModalProps) {
    if (!donation) return null

  const isMember = donation.sourceType === "MEMBER"

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background text-foreground print:p-0 print:border-none print:shadow-none">
        {/* Header Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-b print:hidden">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            {mode === "pdf" ? (
              <>
                <Download className="w-5 h-5 text-primary" />
                <span>{"Export PDF Receipt"}</span>
              </>
            ) : (
              <>
                <Printer className="w-5 h-5 text-primary" />
                <span>{"Print Receipt"}</span>
              </>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="flex items-center gap-1">
              <Printer className="w-4 h-4" />
              <span>{"Print"}</span>
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 ml-2" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Receipt Document Container */}
        <div className="p-8 print:p-4 space-y-6" id="receipt-print-area">
          {/* Organization Header */}
          <div className="text-center pb-6 border-b-2 border-primary/20 space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl">
              <Building className="w-8 h-8" />
              <span>{"FOUNDATION ERP"}</span>
            </div>
            <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              {"Donation Receipt Voucher"}</p>
            <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-semibold mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{"The transaction is successful and recorded in the ledger"}</span>
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">{"Voucher No"}</p>
              <p className="font-mono text-base font-bold text-primary mt-0.5">{donation.voucherNo}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-semibold">{"Date"}</p>
              <p className="font-semibold mt-0.5">{formatDate(donation.date)}</p>
              <p className="text-xs text-muted-foreground">({new Date(donation.date).toLocaleDateString("bn-BD")})</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted text-xs uppercase font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="py-3 px-4">{"Description"}</th>
                  <th className="py-3 px-4 text-right">{"Amount"}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                <tr>
                  <td className="py-4 px-4 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-base text-foreground">
                      <HeartHandshake className="w-4 h-4 text-primary" />
                      <span>{"Fund Destination:"}{donation.groupName}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">{"Donation Source *"}:</span>
                      {isMember ? (
                        <Badge className="bg-emerald-600 text-white text-xs flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>{"Foundation Member"}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-primary text-primary text-xs flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{"Non-member / Donor"}</span>
                        </Badge>
                      )}
                    </div>

                    {isMember ? (
                      <div className="text-xs text-muted-foreground space-y-0.5 border-l-2 border-emerald-500 pl-2 mt-1">
                        <p>{"Donor:"} <span className="font-semibold text-foreground">{donation.member?.fullName || "Foundation Member"}</span></p>
                        <p>{"ID:"} {donation.member?.memberId || donation.memberId}</p>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground space-y-0.5 border-l-2 border-primary pl-2 mt-1">
                        <p>{"Donor:"} <span className="font-semibold text-foreground">{donation.donor?.fullName || "External Donor"}</span></p>
                        {donation.donor && (
                          <>
                            <p>{"Donor ID:"} {donation.donor.donorId}</p>
                            <p>{"Mobile:"} {donation.donor.mobile}</p>
                            {donation.donor.address && <p>{"Address:"} {donation.donor.address}</p>}
                          </>
                        )}
                      </div>
                    )}

                    {donation.remarks && (
                      <p className="text-xs italic bg-muted/50 p-2 rounded mt-2 text-muted-foreground border">
                        {"Comment:"}{donation.remarks}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-lg text-green-600 font-mono align-top">
                    ৳{donation.amount}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-muted/40 font-bold border-t">
                <tr>
                  <td className="py-3 px-4 text-right">{"Total Received"}</td>
                  <td className="py-3 px-4 text-right text-xl text-primary font-mono">৳{donation.amount}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Ledger Verification Footer */}
          <div className="pt-6 border-t text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{"Laser Tracking ID:"}</p>
              <p className="font-mono text-xs opacity-80">{donation.id}</p>
              <p className="text-[10px] mt-0.5">{"Entries made by:"}{donation.createdBy}</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="inline-block border-t border-dashed border-foreground/40 px-6 pt-1 text-xs font-semibold">
                {"Authorized Signature"}</div>
            </div>
          </div>
          
          <div className="text-center text-[10px] text-muted-foreground pt-4 opacity-70">
            {"Single Source of Truth"}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
