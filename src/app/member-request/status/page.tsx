"use client"

import { useEffect, useState, useCallback } from "react"
import { getMemberRequestByApplicationNumber } from "@/features/member-requests/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { PublicHeader } from "@/components/public-header"

export default function MemberRequestStatusPage() {
    const [appNumber, setAppNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [statusData, setStatusData] = useState<any>(null)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  const fetchStatus = useCallback(async (numberToFetch: string) => {
    if (!numberToFetch.trim()) {
      setError("Enter Application Number")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const data = await getMemberRequestByApplicationNumber(numberToFetch.trim())
      if (data) {
        setStatusData(data)
      } else {
        setError("Application not found")
        setStatusData(null)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const storedAppNum = localStorage.getItem("member_request_number")
    if (storedAppNum) {
      setAppNumber(storedAppNum)
      fetchStatus(storedAppNum)
    }
  }, [fetchStatus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStatus(appNumber)
  }

  if (!mounted) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{"Pending Review"}</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">{"Approved"}</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200">{"Rejected"}</Badge>
      case "NEEDS_CHANGES":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{"Changes Requested"}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-dvh w-full relative bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 pt-20">
      <PublicHeader />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{"Application Status"}</CardTitle>
          <CardDescription className="text-center">
            {"Check the status of your membership application."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!statusData && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder={"e.g. MR-2026-00001"}
                  value={appNumber}
                  onChange={(e) => setAppNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Check Status"}
              </Button>
            </form>
          )}

          {statusData && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2 p-6 bg-muted/50 rounded-lg border">
                <div className="text-sm text-muted-foreground">{"Application Number"}</div>
                <div className="font-mono text-xl font-bold">{statusData.applicationNumber}</div>
                <div className="mt-2">{getStatusBadge(statusData.status)}</div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1 text-sm border-b pb-2">
                  <span className="text-muted-foreground">{"Applicant Name"}:</span>
                  <span className="font-medium">{statusData.fullName}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-1 text-sm border-b pb-2">
                  <span className="text-muted-foreground">{"Submitted Date"}:</span>
                  <span className="font-medium">
                    {statusData.submittedAt ? format(new Date(statusData.submittedAt), 'PPP') : 'N/A'}
                  </span>
                </div>

                {statusData.status === 'APPROVED' && statusData.approvedAt && (
                  <div className="grid grid-cols-2 gap-1 text-sm border-b pb-2">
                    <span className="text-muted-foreground">{"Approved Date"}:</span>
                    <span className="font-medium text-emerald-600">
                      {format(new Date(statusData.approvedAt), 'PPP')}
                    </span>
                  </div>
                )}
              </div>

              {statusData.adminMessage && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="font-semibold text-blue-800 text-sm mb-1">
                    {"Message from Admin"}:
                  </div>
                  <div className="text-sm text-blue-700">
                    {statusData.adminMessage}
                  </div>
                </div>
              )}

              {statusData.status === 'REJECTED' && statusData.rejectionReason && (
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                  <div className="font-semibold text-rose-800 text-sm mb-1">
                    {"Rejection Reason"}:
                  </div>
                  <div className="text-sm text-rose-700">
                    {statusData.rejectionReason}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStatusData(null)}>
                  {"Check Another Application"}
                </Button>
                {statusData.status === 'NEEDS_CHANGES' && (
                  <Button className="flex-1" asChild>
                    <Link href={`/member-request/edit/${statusData.applicationNumber}`}>
                      {"Edit Application"}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t pt-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline text-primary">
            {"Back to Home"}
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
