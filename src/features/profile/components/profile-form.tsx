"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Camera, Shield, Smartphone, Mail } from "lucide-react"
import { updateUserProfile, uploadProfilePhoto, changeUserPassword } from "../actions"

interface ProfileData {
  name: string
  username: string
  role: string
  mobile: string | null
  email: string | null
  photo: string | null
}

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const router = useRouter()
  const { update } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState({
    name: initialData.name || "",
    username: initialData.username || "",
    mobile: initialData.mobile || "",
  })
  const [photo, setPhoto] = useState(initialData.photo)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Password state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const res = await updateUserProfile(profile)
      if (res.success) {
        toast.success("Profile updated successfully")
        if (res.requireReauth) {
          toast.info("Your username has changed. Please log in again.")
          setTimeout(() => {
            return (signOut({ callbackUrl: '/login' }));
          }, 2000)
        } else {
          router.refresh()
        }
      } else {
        toast.error(res.error)
      }
    } catch (err: any) {
      toast.error("Profile update failed")
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    
    setIsUploading(true)
    try {
      const res = await uploadProfilePhoto(formData)
      if (res.success) {
        toast.success("Photo uploaded successfully")
        setPhoto(res.url as string)
        await update({ image: res.url as string })
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error("Photo upload failed")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      return toast.error("Passwords do not match")
    }
    if (passwords.new.length < 6) {
      return toast.error("New password must be at least 6 characters")
    }

    setIsChangingPassword(true)
    try {
      const res = await changeUserPassword({ current: passwords.current, new: passwords.new })
      if (res.success) {
        toast.success("Password changed successfully. Please log in again.")
        setTimeout(() => {
          return (signOut({ callbackUrl: '/login' }));
        }, 2000)
      } else {
        toast.error(res.error)
      }
    } catch (err: any) {
      toast.error("Password change failed")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column: Avatar & Summary */}
      <div className="space-y-6 md:col-span-1">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted bg-muted flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt={"Profile"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <label 
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors"
                title={"Change photo"}
              >
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handlePhotoUpload} 
                  disabled={isUploading}
                />
              </label>
            </div>
            
            <h2 className="text-xl font-bold">{initialData.name}</h2>
            <p className="text-sm text-muted-foreground mb-3">@{initialData.username}</p>
            <Badge variant="outline" className="mb-4">{initialData.role}</Badge>

            <div className="w-full space-y-3 text-sm text-left pt-4 border-t">
              <div className="flex items-center text-muted-foreground">
                <Smartphone className="w-4 h-4 mr-2" />
                <span>{initialData.mobile || "No mobile number"}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" />
                <span>{initialData.email || "No email"}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Shield className="w-4 h-4 mr-2" />
                <span>Role: {initialData.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Update Forms */}
      <div className="space-y-6 md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{"Profile Details"}</CardTitle>
            <CardDescription>Update your personal profile information.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{"Full Name"}</Label>
                  <Input 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>{"Username"}</Label>
                  <Input 
                    value={profile.username} 
                    onChange={e => setProfile({...profile, username: e.target.value})} 
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    * If you change your username, you must log in again.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{"Mobile"}</Label>
                  <Input 
                    value={profile.mobile} 
                    onChange={e => setProfile({...profile, mobile: e.target.value})} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{"Change Password"}</CardTitle>
            <CardDescription>Use a strong password to keep your account secure.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordChange}>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label>{"Current Password"}</Label>
                <Input 
                  type="password" 
                  value={passwords.current} 
                  onChange={e => setPasswords({...passwords, current: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{"New Password"}</Label>
                  <Input 
                    type="password" 
                    value={passwords.new} 
                    onChange={e => setPasswords({...passwords, new: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>{"Confirm Password"}</Label>
                  <Input 
                    type="password" 
                    value={passwords.confirm} 
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" variant="destructive" disabled={isChangingPassword}>
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
