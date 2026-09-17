"use server"

import { apiClient } from "@/lib/api/client"
import { memberSchema, type MemberFormValues } from "./schema"
import { revalidatePath } from "next/cache"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

export async function getMembers() {
  try {
    return await apiClient.members.getAll()
  } catch (err) {
    console.error("Failed to fetch members:", err)
    return []
  }
}

export async function getMember(id: string) {
  try {
    return await apiClient.members.getById(id)
  } catch (err) {
    console.error(`Failed to fetch member ${id}:`, err)
    return null
  }
}

export async function generateMemberId() {
  try {
    const res = await apiClient.get<{ memberId: string }>("/api/v1/members/next-id")
    return res.memberId
  } catch {
    return `M-${Date.now().toString().slice(-4)}`
  }
}

async function handleDocumentUpload(
  base64Str: string | undefined,
  title: string,
  folder: string,
  memberId: string,
  documentNumberSuffix: string
) {
  if (!base64Str) return

  try {
    const buffer = Buffer.from(base64Str.replace(/^data:image\/\w+;base64,/, ""), "base64")
    const uploaded = await uploadToCloudinary(buffer, { folder })

    // Check if doc exists for member with title
    const docs = await apiClient.documents.getAll({ memberId })
    const existing = docs.find((d: any) => d.title === title)
    if (existing) {
      if (existing.publicId) {
        await deleteFromCloudinary(existing.publicId).catch(() => {})
      }
      await apiClient.documents.delete(existing.id).catch(() => {})
    }

    await apiClient.documents.create({
      documentNumber: `DOC-${Date.now()}-${documentNumberSuffix}`,
      title,
      documentType: "IMAGE",
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url,
      fileSize: uploaded.bytes || 0,
      mimeType: "image/jpeg",
      memberId: memberId,
    })
  } catch (e) {
    console.error("Failed to upload document for member:", e)
  }
}

export async function createMember(data: MemberFormValues) {
  const parsed = memberSchema.safeParse(data)
  if (!parsed.success) {
    console.error("Zod Validation Error:", parsed.error)
    return { success: false, error: "members.validation.invalid_form", details: parsed.error.format() }
  }

  const pd = parsed.data

  try {
    const referenceData =
      pd.referenceName || pd.referenceMobile || pd.referenceRelation
        ? JSON.stringify({
            name: pd.referenceName || "",
            mobile: pd.referenceMobile || "",
            relation: pd.referenceRelation || "",
          })
        : null

    const payload: any = {
      memberId: pd.memberId || undefined,
      groupId: pd.groupId,
      fullName: pd.fullName?.trim(),
      fatherName: pd.fatherName?.trim() || null,
      motherName: pd.motherName?.trim() || null,
      dob: pd.dob ? new Date(pd.dob).toISOString() : null,
      nationalId: pd.nationalId?.trim() || null,
      occupation: pd.occupation?.trim() || null,
      education: pd.education?.trim() || null,
      presentAddress: pd.presentAddress?.trim() || null,
      permanentAddress: pd.permanentAddress?.trim() || null,
      mobile: pd.mobile?.trim() || null,
      email: pd.email?.trim() || null,
      bloodGroup: pd.bloodGroup?.trim() || null,
      position: pd.position || "GENERAL_MEMBER",
      idDocumentType: pd.idDocumentType || "NID",
      emergencyContactName: pd.emergencyContactName?.trim() || null,
      emergencyContactRelation: pd.emergencyContactRelation?.trim() || null,
      emergencyContactMobile: pd.emergencyContactMobile?.trim() || null,
      reference: referenceData,
      joinDate: pd.joinDate ? new Date(pd.joinDate).toISOString() : new Date().toISOString(),
      status: "ACTIVE",
      declarationAccepted: true,
    }

    const member = await apiClient.members.create(payload)

    // Handle documents
    await handleDocumentUpload(pd.photoBase64, "Member Photo", "foundation/members/photos", member.id, "P")
    await handleDocumentUpload(pd.signatureBase64, "Signature", "foundation/members/signatures", member.id, "SIG")

    if (pd.idDocumentType === "NID") {
      await handleDocumentUpload(pd.nidFrontBase64, "NID Front", "foundation/members/ids", member.id, "NIDF")
      await handleDocumentUpload(pd.nidBackBase64, "NID Back", "foundation/members/ids", member.id, "NIDB")
    } else if (pd.idDocumentType === "BIRTH_CERTIFICATE") {
      await handleDocumentUpload(pd.birthCertificateBase64, "Birth Certificate", "foundation/members/ids", member.id, "BC")
    }

    revalidatePath("/members/manage")
    return { success: true, data: member }
  } catch (error: any) {
    console.error("API error in createMember:", error)
    return { success: false, error: error.message || "members.messages.add_error" }
  }
}

export async function updateMember(id: string, data: MemberFormValues) {
  const parsed = memberSchema.safeParse(data)
  if (!parsed.success) {
    console.error("Member update validation failed:", parsed.error)
    return { success: false, error: "members.validation.invalid_form" }
  }
  const pd = parsed.data

  try {
    const referenceData =
      pd.referenceName || pd.referenceMobile || pd.referenceRelation
        ? JSON.stringify({
            name: pd.referenceName || "",
            mobile: pd.referenceMobile || "",
            relation: pd.referenceRelation || "",
          })
        : null

    const payload: any = {
      memberId: pd.memberId,
      groupId: pd.groupId,
      fullName: pd.fullName?.trim(),
      fatherName: pd.fatherName?.trim() || null,
      motherName: pd.motherName?.trim() || null,
      dob: pd.dob ? new Date(pd.dob).toISOString() : null,
      nationalId: pd.nationalId?.trim() || null,
      occupation: pd.occupation?.trim() || null,
      education: pd.education?.trim() || null,
      presentAddress: pd.presentAddress?.trim() || null,
      permanentAddress: pd.permanentAddress?.trim() || null,
      mobile: pd.mobile?.trim() || null,
      email: pd.email?.trim() || null,
      bloodGroup: pd.bloodGroup?.trim() || null,
      position: pd.position || "GENERAL_MEMBER",
      idDocumentType: pd.idDocumentType || "NID",
      emergencyContactName: pd.emergencyContactName?.trim() || null,
      emergencyContactRelation: pd.emergencyContactRelation?.trim() || null,
      emergencyContactMobile: pd.emergencyContactMobile?.trim() || null,
      reference: referenceData,
      joinDate: pd.joinDate ? new Date(pd.joinDate).toISOString() : undefined,
    }

    const member = await apiClient.members.update(id, payload)

    // Document replacements
    await handleDocumentUpload(pd.photoBase64, "Member Photo", "foundation/members/photos", id, "P")
    await handleDocumentUpload(pd.signatureBase64, "Signature", "foundation/members/signatures", id, "SIG")

    if (pd.idDocumentType === "NID") {
      await handleDocumentUpload(pd.nidFrontBase64, "NID Front", "foundation/members/ids", id, "NIDF")
      await handleDocumentUpload(pd.nidBackBase64, "NID Back", "foundation/members/ids", id, "NIDB")
    } else if (pd.idDocumentType === "BIRTH_CERTIFICATE") {
      await handleDocumentUpload(pd.birthCertificateBase64, "Birth Certificate", "foundation/members/ids", id, "BC")
    }

    revalidatePath("/members/manage")
    revalidatePath(`/members/${id}`)
    revalidatePath(`/members/${id}/edit`)
    return { success: true, data: member }
  } catch (error: any) {
    console.error("API error in updateMember:", error)
    return { success: false, error: error.message || "members.messages.update_error" }
  }
}

export async function deleteMemberDocument(memberId: string, title: string) {
  try {
    const docs = await apiClient.documents.getAll({ memberId })
    const doc = docs.find((d: any) => d.title === title)
    if (doc) {
      if (doc.publicId) {
        await deleteFromCloudinary(doc.publicId).catch(() => {})
      }
      await apiClient.documents.delete(doc.id)
    }

    revalidatePath(`/members/${memberId}`)
    revalidatePath(`/members/${memberId}/edit`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete document" }
  }
}

export async function toggleMemberStatus(id: string, newStatus: string, reason?: string, notes?: string) {
  try {
    const updated = await apiClient.members.update(id, {
      status: newStatus,
      statusReason: reason,
      statusNotes: notes,
    })

    revalidatePath("/members/manage")
    revalidatePath("/members/dues")
    revalidatePath(`/members/${id}`)
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message || "members.messages.status_change_error" }
  }
}

export async function restoreMember(id: string, reason?: string) {
  try {
    await apiClient.members.update(id, {
      status: "ACTIVE",
      statusReason: reason || "Restored by Super Admin",
    })

    revalidatePath("/members/manage")
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "members.messages.restore_error" }
  }
}

export async function getMemberStatusHistory(memberId: string) {
  try {
    return await apiClient.members.getStatusHistory(memberId)
  } catch {
    return []
  }
}

export async function deleteMember(id: string) {
  try {
    await apiClient.members.delete(id)
    revalidatePath("/members/manage")
    revalidatePath("/members")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "members.messages.delete_error" }
  }
}
