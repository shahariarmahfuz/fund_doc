"use client"

import { Button } from "@/components/ui/button"
import { Printer, Edit } from "lucide-react"
import Link from "next/link"

export function BeneficiaryProfileActions({ id }: { id: string }) {
      return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/beneficiaries/${id}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          {"Edit"}</Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => {
            return (window.print());
          }}>
        <Printer className="h-4 w-4 mr-2" />
        {"Print"}</Button>
    </div>
  )
}
