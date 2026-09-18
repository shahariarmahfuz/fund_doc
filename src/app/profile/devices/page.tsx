import { getUserSessions } from "@/features/profile/actions"
import { DevicesTable } from "@/features/profile/components/devices-table"

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Active Devices",
};

export default async function DevicesPage() {
  const { sessions, currentJti } = await getUserSessions()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
        <p className="text-muted-foreground">Logged-in Devices</p>
      </div>
      <DevicesTable sessions={sessions} currentJti={currentJti} />
    </div>
  )
}
