"use server";

import { apiClient } from "@/lib/api/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { baseMemberSchema, type BaseMemberFormValues } from "@/features/members/schema";

async function uploadBase64(base64Str: string, folder: string) {
  const buffer = Buffer.from(base64Str.replace(/^data:image\/\w+;base64,/, ""), "base64");
  return uploadToCloudinary(buffer, { folder });
}

export async function submitMemberRequest(data: BaseMemberFormValues) {
  try {
    const parsed = baseMemberSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Validation failed" };
    }

    const {
      photoBase64,
      nidFrontBase64,
      nidBackBase64,
      birthCertificateBase64,
      signatureBase64,
      ...restData
    } = parsed.data;

    const uploadedDocuments: Array<{ title: string; cloudinaryPublicId: string; secureUrl: string }> = [];

    if (photoBase64) {
      const res = await uploadBase64(photoBase64, "foundation/member-requests/photos");
      uploadedDocuments.push({ title: "Photo", cloudinaryPublicId: res.public_id, secureUrl: res.secure_url });
    }
    if (nidFrontBase64) {
      const res = await uploadBase64(nidFrontBase64, "foundation/member-requests/ids");
      uploadedDocuments.push({ title: "NID Front", cloudinaryPublicId: res.public_id, secureUrl: res.secure_url });
    }
    if (nidBackBase64) {
      const res = await uploadBase64(nidBackBase64, "foundation/member-requests/ids");
      uploadedDocuments.push({ title: "NID Back", cloudinaryPublicId: res.public_id, secureUrl: res.secure_url });
    }
    if (birthCertificateBase64) {
      const res = await uploadBase64(birthCertificateBase64, "foundation/member-requests/ids");
      uploadedDocuments.push({ title: "Birth Certificate", cloudinaryPublicId: res.public_id, secureUrl: res.secure_url });
    }
    if (signatureBase64) {
      const res = await uploadBase64(signatureBase64, "foundation/member-requests/signatures");
      uploadedDocuments.push({ title: "Signature", cloudinaryPublicId: res.public_id, secureUrl: res.secure_url });
    }

    const payload = {
      ...restData,
      dob: restData.dob ? new Date(restData.dob).toISOString() : undefined,
      documents: uploadedDocuments.length > 0 ? JSON.stringify(uploadedDocuments) : null,
    };

    const res = await apiClient.post<any>("/api/v1/member-requests/public/submit", payload);

    return { success: true, applicationNumber: res.applicationNumber, id: res.id };
  } catch (error: any) {
    console.error("Failed to submit member request:", error);
    return { success: false, error: error?.message || "Failed to submit" };
  }
}

export async function getMemberRequestByApplicationNumber(applicationNumber: string) {
  try {
    return await apiClient.get<any>(`/api/v1/member-requests/by-application/${applicationNumber}`);
  } catch {
    return null;
  }
}

export async function getMemberRequests() {
  try {
    return await apiClient.memberRequests.getAll();
  } catch (err) {
    console.error("Failed to fetch member requests:", err);
    return [];
  }
}

export async function getMemberRequest(id: string) {
  try {
    return await apiClient.memberRequests.getById(id);
  } catch (err) {
    console.error(`Failed to fetch member request ${id}:`, err);
    return null;
  }
}

export async function approveMemberRequest(id: string) {
  try {
    const res = await apiClient.post<any>(`/api/v1/member-requests/${id}/approve`);
    revalidatePath("/members/manage");
    revalidatePath("/members/requests");
    return { success: true, ...res };
  } catch (error: any) {
    console.error("Failed to approve member request:", error);
    return { success: false, error: error?.message || "Failed to approve" };
  }
}

export async function rejectMemberRequest(id: string, reason: string) {
  try {
    await apiClient.memberRequests.updateStatus(id, {
      status: "REJECTED",
      rejectionReason: reason,
    });
    revalidatePath("/members/requests");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to reject" };
  }
}

export async function requestChangesMemberRequest(id: string, message: string) {
  try {
    await apiClient.memberRequests.updateStatus(id, {
      status: "NEEDS_CHANGES",
      adminMessage: message,
    });
    revalidatePath("/members/requests");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to request changes" };
  }
}

export async function deleteMemberRequest(id: string) {
  try {
    await apiClient.delete(`/api/v1/member-requests/${id}`);
    revalidatePath("/members/requests");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete" };
  }
}

export async function getGroups() {
  try {
    return await apiClient.groups.getSignupEligible();
  } catch {
    return [];
  }
}
