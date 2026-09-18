"use server"

import { apiClient } from "@/lib/api/client"
import { getAuthSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { uploadToCloudinary } from "@/lib/cloudinary"

async function getSessionUser() {
  const session = await getAuthSession()
  const user = session?.user as any
  if (!user?.id) redirect("/login")
  return { ...session, user } as any
}

export async function getUserProfile() {
  const session = await getSessionUser()
  const user = await apiClient.users.getById(session.user.id)
  if (!user) throw new Error("User not found")

  return {
    name: user.name,
    username: user.username,
    role: user.role?.name || "USER",
    mobile: user.mobile,
    email: user.email,
    photo: user.photo,
  }
}

export async function updateUserProfile(data: { name: string; username: string; mobile: string }) {
  const session = await getSessionUser()
  try {
    await apiClient.users.update(session.user.id, {
      name: data.name,
      username: data.username,
      mobile: data.mobile || null,
    })

    const requireReauth = data.username !== session.user.username
    revalidatePath("/profile")
    return { success: true, requireReauth }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update profile." }
  }
}

export async function uploadProfilePhoto(formData: FormData) {
  const session = await getSessionUser()
  const file = formData.get("file") as File | null

  if (!file) return { success: false, error: "No file provided" }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { success: false, error: "Unsupported image type. Use JPG, PNG or WEBP." }
  }

  if (file.size > 5 * 1024 * 1024) return { success: false, error: "File exceeds 5MB limit" }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadToCloudinary(buffer, {
      folder: "foundation/profiles",
    })

    if (!uploaded?.secure_url) {
      return { success: false, error: "Failed to upload image to Cloudinary" }
    }

    const secureUrl = uploaded.secure_url

    await apiClient.users.update(session.user.id, { photo: secureUrl })

    revalidatePath("/profile")
    revalidatePath("/settings/profile")
    return { success: true, url: secureUrl }
  } catch (e: any) {
    console.error("Cloudinary upload profile error:", e)
    return { success: false, error: e?.message || "Failed to upload photo" }
  }
}

export async function changeUserPassword(data: { current: string; new: string }) {
  const session = await getSessionUser()
  try {
    await apiClient.users.changePassword(session.user.id, {
      current_password: data.current,
      new_password: data.new,
    })

    return { success: true, requireReauth: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to change password." }
  }
}
