"use server"

import { apiClient } from "@/lib/api/client"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

// Document Categories
export async function getDocumentCategories() {
  try {
    return await apiClient.documents.getCategories()
  } catch {
    return []
  }
}

export async function createDocumentCategory(name: string, description?: string) {
  try {
    const category = await apiClient.documents.createCategory({ name, description })
    revalidatePath("/documents")
    return { success: true, data: category }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create category" }
  }
}

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file") as File | null
  const title = formData.get("title") as string
  const categoryId = formData.get("categoryId") as string
  const targetType = formData.get("targetType") as any
  const entityId = formData.get("entityId") as string
  const description = formData.get("description") as string
  const remarks = formData.get("remarks") as string

  if (!file) return { success: false, error: "No file provided" }
  if (!title || !targetType || !entityId) return { success: false, error: "Missing required fields" }

  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
  if (!allowedMimeTypes.includes(file.type)) return { success: false, error: "Unsupported file type" }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) return { success: false, error: "File exceeds 5MB limit" }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const originalFilename = file.name
  const ext = originalFilename.split(".").pop()
  const generatedFilename = `${crypto.randomBytes(16).toString("hex")}.${ext}`
  const uploadDir = join(process.cwd(), "public", "uploads")

  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (e) {}

  const path = join(uploadDir, generatedFilename)

  try {
    await writeFile(path, buffer)
  } catch (e: any) {
    return { success: false, error: "Failed to save file physically: " + e.message }
  }

  try {
    const doc = await apiClient.documents.create({
      title,
      categoryId: categoryId || undefined,
      secureUrl: `/uploads/${generatedFilename}`,
      originalFilename,
      cloudinaryPublicId: generatedFilename,
      mimeType: file.type,
      sizeBytes: file.size,
      targetType,
      entityId,
      description,
      remarks,
    })

    revalidatePath("/documents")
    revalidatePath(`/${targetType.toLowerCase()}s/${entityId}`)
    return { success: true, data: doc }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save document metadata" }
  }
}

export async function getDocumentsByEntity(targetType: any, entityId: string) {
  try {
    return await apiClient.documents.getAll({
      memberId: targetType === "MEMBER" ? entityId : undefined,
      beneficiaryId: targetType === "BENEFICIARY" ? entityId : undefined,
    })
  } catch {
    return []
  }
}

export async function getAllDocuments() {
  try {
    return await apiClient.documents.getAll()
  } catch {
    return []
  }
}

export async function deleteDocumentById(id: string) {
  try {
    await apiClient.documents.delete(id)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message }
  }
}
