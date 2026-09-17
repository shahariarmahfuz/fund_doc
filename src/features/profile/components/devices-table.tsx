"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Smartphone, Tablet, LogOut } from "lucide-react"
import { logoutDevice, logoutOtherDevices, logoutAllDevices } from "../actions"

export function DevicesTable({ sessions, currentJti }: { sessions: any[], currentJti: string }) {
      const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleLogout = async (jti: string) => {
    setIsProcessing(true)
    try {
      await logoutDevice(jti)
      toast.success("\u09a1\u09bf\u09ad\u09be\u0987\u09b8\u099f\u09bf \u09b8\u09ab\u09b2\u09ad\u09be\u09ac\u09c7 \u09b2\u0997\u0986\u0989\u099f \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7")
      if (jti === currentJti) {
        signOut({ callbackUrl: window.location.origin + '/login' })
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error("\u09b2\u0997\u0986\u0989\u099f \u09ac\u09cd\u09af\u09b0\u09cd\u09a5 \u09b9\u09af\u09bc\u09c7\u099b\u09c7")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogoutOthers = async () => {
    setIsProcessing(true)
    try {
      await logoutOtherDevices()
      toast.success("\u0985\u09a8\u09cd\u09af\u09be\u09a8\u09cd\u09af \u09b8\u0995\u09b2 \u09a1\u09bf\u09ad\u09be\u0987\u09b8 \u09a5\u09c7\u0995\u09c7 \u09b2\u0997\u0986\u0989\u099f \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7")
      router.refresh()
    } catch (err) {
      toast.error("\u09b2\u0997\u0986\u0989\u099f \u09ac\u09cd\u09af\u09b0\u09cd\u09a5 \u09b9\u09af\u09bc\u09c7\u099b\u09c7")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to log out from all devices?")) return
    setIsProcessing(true)
    try {
      const res = await logoutAllDevices()
      if (res.requireReauth) {
        toast.success("\u09b8\u0995\u09b2 \u09a1\u09bf\u09ad\u09be\u0987\u09b8 \u09a5\u09c7\u0995\u09c7 \u09b2\u0997\u0986\u0989\u099f \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7")
        signOut({ callbackUrl: window.location.origin + '/login' })
      }
    } catch (err) {
      toast.error("\u09b2\u0997\u0986\u0989\u099f \u09ac\u09cd\u09af\u09b0\u09cd\u09a5 \u09b9\u09af\u09bc\u09c7\u099b\u09c7")
    } finally {
      setIsProcessing(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    if (device === "Mobile") return <Smartphone className="w-5 h-5" />
    if (device === "Tablet") return <Tablet className="w-5 h-5" />
    return <Monitor className="w-5 h-5" />
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>{"Active Sessions"}</CardTitle>
          <CardDescription>{"\u09af\u09c7 \u09b8\u0995\u09b2 \u09a1\u09bf\u09ad\u09be\u0987\u09b8 \u09a5\u09c7\u0995\u09c7 \u0986\u09aa\u09a8\u09bf \u09ac\u09b0\u09cd\u09a4\u09ae\u09be\u09a8\u09c7 \u09b2\u0997\u0987\u09a8 \u0986\u099b\u09c7\u09a8\u0964"}</CardDescription>
        </div>
        <div className="flex gap-2">
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleLogoutOthers} disabled={isProcessing}>
              {"\u0985\u09a8\u09cd\u09af\u09be\u09a8\u09cd\u09af \u09a1\u09bf\u09ad\u09be\u0987\u09b8 \u09b2\u0997\u0986\u0989\u099f \u0995\u09b0\u09c1\u09a8"}</Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleLogoutAll} disabled={isProcessing}>
            {"\u09b8\u0995\u09b2 \u09a1\u09bf\u09ad\u09be\u0987\u09b8 \u09b2\u0997\u0986\u0989\u099f \u0995\u09b0\u09c1\u09a8"}</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => {
            const isCurrent = session.jti === currentJti
            return (
              <div key={session.id} className={`flex items-center justify-between p-4 border rounded-lg ${isCurrent ? 'bg-primary/5 border-primary/20' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    {getDeviceIcon(session.device)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{session.os} - {session.browser}</h4>
                      {isCurrent && <Badge variant="default" className="text-xs">{"\u09ac\u09b0\u09cd\u09a4\u09ae\u09be\u09a8 \u09a1\u09bf\u09ad\u09be\u0987\u09b8"}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 space-x-2">
                      <span>{"IP:"}{session.ipAddress}</span>
                      <span>•</span>
                      <span>{"\u09b8\u09b0\u09cd\u09ac\u09b6\u09c7\u09b7 \u09b8\u0995\u09cd\u09b0\u09bf\u09af\u09bc:"}{new Date(session.lastActive).toLocaleString('bn-BD')}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    return (handleLogout(session.jti));
                  }}
                  disabled={isProcessing}
                  title={"\u098f\u0987 \u09a1\u09bf\u09ad\u09be\u0987\u09b8 \u09a5\u09c7\u0995\u09c7 \u09b2\u0997\u0986\u0989\u099f \u0995\u09b0\u09c1\u09a8"}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {"\u0995\u09cb\u09a8 \u09b8\u0995\u09cd\u09b0\u09bf\u09af\u09bc \u09b8\u09c7\u09b6\u09a8 \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964"}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
