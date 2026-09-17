"use client"

import { useState } from "react"
import { saveFoundationProfile } from "@/features/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

export function ProfileForm({ initialData }: { initialData: any }) {
      const [data, setData] = useState(initialData)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Remove id before saving if it exists and we're not using it directly in update
      const { id, updatedAt, updatedBy, ...saveData } = data
      await saveFoundationProfile(saveData)
      toast.success("Profile saved successfully")
    } catch (err) {
      toast.error("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Foundation Profile"}</CardTitle>
        <CardDescription>{"Update your organization's primary information."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{"Organization Name"}</Label>
              <Input value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>{"Registration Number"}</Label>
              <Input value={data.registrationNumber || ""} onChange={e => setData({...data, registrationNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{"Email"}</Label>
              <Input type="email" value={data.email || ""} onChange={e => setData({...data, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{"Phone"}</Label>
              <Input value={data.phone || ""} onChange={e => setData({...data, phone: e.target.value})} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{"Address"}</Label>
              <Textarea value={data.address || ""} onChange={e => setData({...data, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{"Website"}</Label>
              <Input value={data.website || ""} onChange={e => setData({...data, website: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{"Currency"}</Label>
              <Input value={data.currency || "BDT"} onChange={e => setData({...data, currency: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
