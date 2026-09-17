"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Circle } from "lucide-react"

interface Member {
  id: string
  fullName: string | null
  memberId: string
  group: { name: string } | null
}

interface Contribution {
  memberId: string
  month: number
  status: string
}

export function MonthlyMatrixTable({ 
  members, 
  contributions, 
  currentMonth 
}: { 
  members: Member[], 
  contributions: Contribution[], 
  currentMonth: number 
}) {
  
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  const getCellState = (memberId: string, month: number) => {
    const record = contributions.find(c => c.memberId === memberId && c.month === month)
    
    if (record) {
      if (record.status === "PAID") return "PAID"
      if (record.status === "PENDING") return "PENDING"
    }
    
    if (month <= currentMonth) {
      return "DUE"
    }
    
    return "FUTURE"
  }

  const renderCell = (state: string) => {
    switch (state) {
      case "PAID":
        return <div className="flex justify-center items-center w-full h-full"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
      case "PENDING":
        return <div className="flex justify-center items-center w-full h-full"><Clock className="h-5 w-5 text-orange-500" /></div>
      case "DUE":
        return <div className="flex justify-center items-center w-full h-full"><Circle className="h-4 w-4 text-orange-300 fill-orange-100" /></div>
      case "FUTURE":
        return <div className="flex justify-center items-center w-full h-full"><Circle className="h-4 w-4 text-muted-foreground/30" /></div>
      default:
        return null
    }
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table className="min-w-max text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] sticky left-0 bg-card z-20 shadow-[1px_0_0_0_#e2e8f0]">Member</TableHead>
            <TableHead className="w-[100px]">Group</TableHead>
            {months.map(m => (
              <TableHead key={m} className="text-center w-12 px-1">
                {(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1])}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(member => (
            <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium sticky left-0 bg-card z-10 shadow-[1px_0_0_0_#e2e8f0]">
                {member.fullName || 'Unknown'} <span className="text-muted-foreground text-xs block">{member.memberId}</span>
              </TableCell>
              <TableCell className="text-xs">{member.group?.name || "-"}</TableCell>
              {months.map(m => {
                const state = getCellState(member.id, m)
                return (
                  <TableCell key={m} className={`p-0 h-12 w-12 border-l`}>
                    <div className={`w-full h-full flex items-center justify-center 
                      ${state === 'PAID' ? 'bg-green-50/50 hover:bg-green-100/50' : ''}
                      ${state === 'PENDING' || state === 'DUE' ? 'bg-orange-50/50 hover:bg-orange-100/50' : ''}
                      ${state === 'FUTURE' ? 'hover:bg-muted/50' : ''}
                    `}>
                      {renderCell(state)}
                    </div>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="p-4 border-t flex gap-6 text-sm">
        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> <span>Paid</span></div>
        <div className="flex items-center gap-2"><Circle className="h-3 w-3 text-orange-300 fill-orange-100" /> <span>Pending / Due</span></div>
        <div className="flex items-center gap-2"><Circle className="h-3 w-3 text-muted-foreground/30" /> <span>Future</span></div>
      </div>
    </div>
  )
}
