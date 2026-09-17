"use server"

import { apiClient } from "@/lib/api/client"
import { beneficiarySchema, type BeneficiaryFormValues } from "./schema"
import { revalidatePath } from "next/cache"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

export async function getBeneficiaries() {
  try {
    return await apiClient.beneficiaries.getAll()
  } catch (err) {
    console.error("Failed to fetch beneficiaries:", err)
    return []
  }
}

export async function getBeneficiary(id: string) {
  try {
    return await apiClient.beneficiaries.getById(id)
  } catch (err) {
    console.error(`Failed to fetch beneficiary ${id}:`, err)
    return null
  }
}

async function handleDocumentUpload(
  base64Str: string | undefined,
  title: string,
  folder: string,
  beneficiaryId: string,
  documentNumberSuffix: string,
  updateLegacyField?: "beneficiaryPhoto" | "nidOrBirthCertificate"
) {
  if (!base64Str) return

  try {
    const buffer = Buffer.from(base64Str.replace(/^data:image\/\w+;base64,/, ""), "base64")
    const uploaded = await uploadToCloudinary(buffer, { folder })

    const docs = await apiClient.documents.getAll({ beneficiaryId })
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
      beneficiaryId: beneficiaryId,
    })

    if (updateLegacyField) {
      await apiClient.beneficiaries.update(beneficiaryId, { [updateLegacyField]: uploaded.secure_url })
    }
  } catch (e) {
    console.error("Failed to upload document for beneficiary:", e)
  }
}

export async function createBeneficiary(data: BeneficiaryFormValues) {
  const parsed = beneficiarySchema.safeParse(data)
  if (!parsed.success) {
    console.error("Zod Validation Error:", parsed.error)
    return { success: false, error: "Invalid data", details: parsed.error.format() }
  }

  const pd = parsed.data

  try {
    const payload: any = {
      fullName: pd.fullName.trim(),
      fatherOrHusbandName: pd.fatherOrHusbandName?.trim() || null,
      email: pd.email?.trim() || null,
      mobile: pd.mobile?.trim() || null,
      phone: pd.phone?.trim() || null,
      address: pd.address?.trim() || pd.presentAddress?.trim() || null,
      presentAddress: pd.presentAddress?.trim() || null,
      permanentAddress: pd.permanentAddress?.trim() || null,
      nationalId: pd.nationalId?.trim() || null,
      idDocumentType: pd.idDocumentType || "NID",
      beneficiaryPhoto: pd.beneficiaryPhoto || null,
      nidOrBirthCertificate: pd.nidOrBirthCertificate || null,
      occupation: pd.occupation?.trim() || null,
      remarks: pd.remarks?.trim() || null,
      relationToMember: pd.relationToMember?.trim() || null,
      emergencyContactName: pd.emergencyContactName?.trim() || null,
      emergencyContactRelation: pd.emergencyContactRelation?.trim() || null,
      emergencyContactMobile: pd.emergencyContactMobile?.trim() || null,
      memberId: pd.memberId || null,
      status: pd.status || "ACTIVE",
    }

    const beneficiary = await apiClient.beneficiaries.create(payload)

    if (pd.photoBase64) {
      await handleDocumentUpload(pd.photoBase64, "Beneficiary Photo", "foundation/beneficiaries/photos", beneficiary.id, "P", "beneficiaryPhoto")
    }
    if (pd.signatureBase64) {
      await handleDocumentUpload(pd.signatureBase64, "Signature", "foundation/beneficiaries/signatures", beneficiary.id, "SIG")
    }
    if (pd.idDocumentType === "NID") {
      if (pd.nidFrontBase64) {
        await handleDocumentUpload(pd.nidFrontBase64, "NID Front", "foundation/beneficiaries/ids", beneficiary.id, "NIDF", "nidOrBirthCertificate")
      }
      if (pd.nidBackBase64) {
        await handleDocumentUpload(pd.nidBackBase64, "NID Back", "foundation/beneficiaries/ids", beneficiary.id, "NIDB")
      }
    } else if (pd.idDocumentType === "BIRTH_CERTIFICATE") {
      if (pd.birthCertificateBase64) {
        await handleDocumentUpload(pd.birthCertificateBase64, "Birth Certificate", "foundation/beneficiaries/ids", beneficiary.id, "BC", "nidOrBirthCertificate")
      }
    }

    revalidatePath("/beneficiaries")
    return { success: true, data: beneficiary }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create beneficiary" }
  }
}

export async function updateBeneficiary(id: string, data: BeneficiaryFormValues) {
  const parsed = beneficiarySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data" }

  const pd = parsed.data

  try {
    const payload: any = {
      fullName: pd.fullName.trim(),
      fatherOrHusbandName: pd.fatherOrHusbandName?.trim() || null,
      email: pd.email?.trim() || null,
      mobile: pd.mobile?.trim() || null,
      phone: pd.phone?.trim() || null,
      address: pd.address?.trim() || pd.presentAddress?.trim() || null,
      presentAddress: pd.presentAddress?.trim() || null,
      permanentAddress: pd.permanentAddress?.trim() || null,
      nationalId: pd.nationalId?.trim() || null,
      idDocumentType: pd.idDocumentType || "NID",
      occupation: pd.occupation?.trim() || null,
      remarks: pd.remarks?.trim() || null,
      relationToMember: pd.relationToMember?.trim() || null,
      emergencyContactName: pd.emergencyContactName?.trim() || null,
      emergencyContactRelation: pd.emergencyContactRelation?.trim() || null,
      emergencyContactMobile: pd.emergencyContactMobile?.trim() || null,
      memberId: pd.memberId || null,
      status: pd.status || "ACTIVE",
    }

    const beneficiary = await apiClient.beneficiaries.update(id, payload)

    if (pd.photoBase64) {
      await handleDocumentUpload(pd.photoBase64, "Beneficiary Photo", "foundation/beneficiaries/photos", id, "P", "beneficiaryPhoto")
    }
    if (pd.signatureBase64) {
      await handleDocumentUpload(pd.signatureBase64, "Signature", "foundation/beneficiaries/signatures", id, "SIG")
    }
    if (pd.idDocumentType === "NID") {
      if (pd.nidFrontBase64) {
        await handleDocumentUpload(pd.nidFrontBase64, "NID Front", "foundation/beneficiaries/ids", id, "NIDF", "nidOrBirthCertificate")
      }
      if (pd.nidBackBase64) {
        await handleDocumentUpload(pd.nidBackBase64, "NID Back", "foundation/beneficiaries/ids", id, "NIDB")
      }
    } else if (pd.idDocumentType === "BIRTH_CERTIFICATE") {
      if (pd.birthCertificateBase64) {
        await handleDocumentUpload(pd.birthCertificateBase64, "Birth Certificate", "foundation/beneficiaries/ids", id, "BC", "nidOrBirthCertificate")
      }
    }

    revalidatePath("/beneficiaries")
    revalidatePath(`/beneficiaries/${id}`)
    return { success: true, data: beneficiary }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update beneficiary" }
  }
}

export async function deleteBeneficiaryDocument(beneficiaryId: string, title: string) {
  try {
    const docs = await apiClient.documents.getAll({ beneficiaryId })
    const doc = docs.find((d: any) => d.title === title)
    if (doc) {
      if (doc.publicId) {
        await deleteFromCloudinary(doc.publicId).catch(() => {})
      }
      await apiClient.documents.delete(doc.id)
    }

    revalidatePath(`/beneficiaries/${beneficiaryId}`)
    revalidatePath(`/beneficiaries/${beneficiaryId}/edit`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete document" }
  }
}

export async function deleteBeneficiary(id: string) {
  try {
    await apiClient.beneficiaries.delete(id)
    revalidatePath("/beneficiaries")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete beneficiary" }
  }
}
