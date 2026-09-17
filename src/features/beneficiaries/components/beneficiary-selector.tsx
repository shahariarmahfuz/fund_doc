"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getBeneficiaries } from "../actions"
import { MemberCombobox } from "@/components/member-combobox"

type BeneficiaryOption = {
  id: string
  name: string
  beneficiaryId: string
}

export function BeneficiarySelector() {
      const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentBeneficiaryId = searchParams.get("beneficiaryId") || ""
  
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryOption[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    getBeneficiaries().then(data => {
      setBeneficiaries(
        data.map(b => ({
          id: b.id,
          name: `${b.fullName || "Name not found"}`,
          beneficiaryId: b.beneficiaryId
        }))
      )
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set("beneficiaryId", value)
    } else {
      params.delete("beneficiaryId")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">{"Select beneficiary"}</span>
      <div className="w-[250px]">
        {loading ? (
          <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
            {"Loading..."}</div>
        ) : (
          <MemberCombobox
            members={beneficiaries.map(b => ({ id: b.id, beneficiaryId: b.beneficiaryId, fullName: b.name }))}
            value={currentBeneficiaryId}
            onChange={handleValueChange}
            placeholder={"Select a beneficiary..."}
          />
        )}
      </div>
    </div>
  )
}
