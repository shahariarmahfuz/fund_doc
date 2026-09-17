"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import Link from "next/link"

export function MemberProfileActions({ memberId }: { memberId: string }) {
      return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/members/${memberId}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          {"Edit"}</Link>
      </Button>
    </div>
  )
}

