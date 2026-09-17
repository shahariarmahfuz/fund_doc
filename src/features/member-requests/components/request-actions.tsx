"use client"

import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { approveMemberRequest, rejectMemberRequest, requestChangesMemberRequest } from "@/features/member-requests/actions"
import { toast } from "sonner"
import { Check, X, AlertCircle } from "lucide-react"

export function RequestActions({ requestId, status }: { requestId: string, status: string }) {
    const [loading, setLoading] = useState(false)
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "CHANGES" | null>(null)
  
  const [reason, setReason] = useState("")

  if (status === "APPROVED" || status === "REJECTED") {
    return null
  }

  const handleAction = async () => {
    setLoading(true)
    try {
      if (actionType === "APPROVE") {
        const res = await approveMemberRequest(requestId)
        if (res.success) {
          toast.success("Application approved. Member created successfully.")
          setActionType(null)
        } else {
          toast.error((res as any).error || "An error occurred")
        }
      } else if (actionType === "REJECT") {
        if (!reason.trim()) {
          toast.error("Reason is required.")
          setLoading(false)
          return
        }
        const res = await rejectMemberRequest(requestId, reason)
        if (res.success) {
          toast.success("Application rejected.")
          setActionType(null)
        } else {
          toast.error((res as any).error || "An error occurred")
        }
      } else if (actionType === "CHANGES") {
        if (!reason.trim()) {
          toast.error("Reason is required.")
          setLoading(false)
          return
        }
        const res = await requestChangesMemberRequest(requestId, reason)
        if (res.success) {
          toast.success("Changes requested.")
          setActionType(null)
        } else {
          toast.error((res as any).error || "An error occurred")
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
            <span className="sr-only">{"Actions"}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            {"Actions"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-emerald-600 focus:text-emerald-600"
            onClick={() => setActionType("APPROVE")}
          >
            <Check className="mr-2 h-4 w-4" />
            <span>{"Approve"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            className="cursor-pointer text-amber-600 focus:text-amber-600"
            onClick={() => setActionType("CHANGES")}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>{"Request Changes"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => setActionType("REJECT")}
          >
            <X className="mr-2 h-4 w-4" />
            <span>{"Reject"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!actionType} onOpenChange={(open) => {
        if (!open) {
          setActionType(null)
          setReason("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVE" && "Approve Application"}
              {actionType === "REJECT" && "Reject Application"}
              {actionType === "CHANGES" && "Request Changes"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "APPROVE" && "Are you sure you want to approve this application? This will create a new member."}
              {actionType === "REJECT" && "Reason for rejection"}
              {actionType === "CHANGES" && "Message to applicant"}
            </DialogDescription>
          </DialogHeader>

          {(actionType === "REJECT" || actionType === "CHANGES") && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">{"Reason"}</Label>
                <Textarea 
                  id="reason" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder={"Enter reason or details..."}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)} disabled={loading}>
              {"Cancel"}
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={loading}
              variant={actionType === "REJECT" ? "destructive" : "default"}
              className={actionType === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {loading ? "Loading..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
