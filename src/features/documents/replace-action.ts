"use server"

import { apiClient } from "@/lib/api/client"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

export async function replaceDocument(documentId: string, formData: FormData) {
  const file = formData.get("file") as File | null

  if (!file) return { success: false, error: "No file provided" }

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
    const updatedDoc = await apiClient.put<any>(`/api/v1/documents/${documentId}`, {
      type: file.type.startsWith("image/") ? "IMAGE" : "PDF",
      secureUrl: `/uploads/${generatedFilename}`,
      originalFilename,
      cloudinaryPublicId: generatedFilename,
      mimeType: file.type,
      sizeBytes: file.size,
    })

    revalidatePath("/documents")
    return { success: true, data: updatedDoc }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update document" }
  }
}
