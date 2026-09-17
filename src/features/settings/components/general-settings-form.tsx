"use client"

import { useState } from "react"
import { saveSystemSettings } from "@/features/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function GeneralSettingsForm({ initialData }: { initialData: Record<string, string> }) {
      const [data, setData] = useState({
    APP_TIMEZONE: initialData.APP_TIMEZONE || "UTC",
    APP_DATE_FORMAT: initialData.APP_DATE_FORMAT || "DD/MM/YYYY",
    APP_THEME: initialData.APP_THEME || "system",
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await saveSystemSettings(data)
      toast.success("Settings saved successfully")
    } catch (err) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"System Settings"}</CardTitle>
        <CardDescription>{"Configure global application preferences and defaults."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{"Time Zone"}</Label>
              <Select value={data.APP_TIMEZONE} onValueChange={(val) => setData({...data, APP_TIMEZONE: val})}>
                <SelectTrigger>
                  <SelectValue placeholder={"Select time zone"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Dhaka">{"Asia/Dhaka"}</SelectItem>
                  <SelectItem value="Asia/Kolkata">{"Asia/Kolkata"}</SelectItem>
                  <SelectItem value="Asia/Dubai">{"Asia/Dubai"}</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">{"Europe/London"}</SelectItem>
                  <SelectItem value="America/New_York">{"America/New_York"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{"Date Format"}</Label>
              <Select value={data.APP_DATE_FORMAT} onValueChange={(val) => setData({...data, APP_DATE_FORMAT: val})}>
                <SelectTrigger>
                  <SelectValue placeholder={"Select date format"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">{"DD/MM/YYYY"}</SelectItem>
                  <SelectItem value="MM/DD/YYYY">{"MM/DD/YYYY"}</SelectItem>
                  <SelectItem value="YYYY-MM-DD">{"YYYY-MM-DD"}</SelectItem>
                  <SelectItem value="DD MMM YYYY">{"DD MMM YYYY"}</SelectItem>
                  <SelectItem value="DD MMMM YYYY">{"DD MMMM YYYY"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{"Default Theme"}</Label>
              <Select value={data.APP_THEME} onValueChange={(val) => setData({...data, APP_THEME: val})}>
                <SelectTrigger>
                  <SelectValue placeholder={"Select theme"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{"Light"}</SelectItem>
                  <SelectItem value="dark">{"Dark"}</SelectItem>
                  <SelectItem value="system">{"System Default"}</SelectItem>
                </SelectContent>
              </Select>
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
