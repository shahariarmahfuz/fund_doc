"use client"

import { useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Eye } from "lucide-react"
import { RequestActions } from "@/features/member-requests/components/request-actions"

interface MemberRequest {
  id: string
  applicationNumber: string
  fullName: string
  phone: string | null
  submittedAt: Date
  status: string
}

export function RequestsTable({ data }: { data: MemberRequest[] }) {
    const [searchTerm, setSearchTerm] = useState("")

  const filteredData = data.filter(item => 
    item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm)
  )

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={"Search"}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{"Application Number"}</TableHead>
              <TableHead>{"Applicant Name"}</TableHead>
              <TableHead>{"Phone"}</TableHead>
              <TableHead>{"Submitted Date"}</TableHead>
              <TableHead>{"Status"}</TableHead>
              <TableHead className="text-right">{"Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  {"No data available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.applicationNumber}</TableCell>
                  <TableCell>{req.fullName}</TableCell>
                  <TableCell>{req.phone || '-'}</TableCell>
                  <TableCell>{format(new Date(req.submittedAt), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/members/requests/${req.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          {"View"}
                        </Link>
                      </Button>
                      <RequestActions requestId={req.id} status={req.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
