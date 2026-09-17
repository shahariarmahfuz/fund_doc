"use client"

import { useState } from "react"
import { saveUserPreferences } from "@/features/settings/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PreferencesForm({ initialData, userId }: { initialData: any, userId: string }) {
  const [data, setData] = useState({
    theme: initialData?.theme || "system",
    dateFormatOverride: initialData?.dateFormatOverride || "",
    timeFormat: initialData?.timeFormat || "12h",
    tableDensity: initialData?.tableDensity || "comfortable",
    defaultDashboard: initialData?.defaultDashboard || "overview",
    itemsPerPage: initialData?.itemsPerPage || "10",
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await saveUserPreferences(userId, data)
      toast.success("Preferences saved successfully")
    } catch (err) {
      toast.error("Failed to save preferences")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
        <CardDescription>Personalize your interface and behavior.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={data.theme} onValueChange={(val) => setData({...data, theme: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format Override</Label>
              <Select value={data.dateFormatOverride} onValueChange={(val) => setData({...data, dateFormatOverride: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Date Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Use System Default)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={data.timeFormat} onValueChange={(val) => setData({...data, timeFormat: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Time Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-Hour</SelectItem>
                  <SelectItem value="24h">24-Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Table Density</Label>
              <Select value={data.tableDensity} onValueChange={(val) => setData({...data, tableDensity: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Table Density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Dashboard</Label>
              <Select value={data.defaultDashboard} onValueChange={(val) => setData({...data, defaultDashboard: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Default Dashboard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="financials">Financials</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Items Per Page</Label>
              <Select value={data.itemsPerPage} onValueChange={(val) => setData({...data, itemsPerPage: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Items Per Page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
