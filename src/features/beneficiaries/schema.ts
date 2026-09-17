import { z } from "zod"

export const beneficiarySchema = z.object({
  // Section 1: Personal Information
  fullName: z.string().min(1, "beneficiaries.validation.full_name_required"),
  fatherOrHusbandName: z.string().optional().or(z.literal("")),
  nationalId: z.string().optional().or(z.literal("")),
  mobile: z.string().optional().or(z.literal("")),
  presentAddress: z.string().optional().or(z.literal("")),
  permanentAddress: z.string().optional().or(z.literal("")),

  // Internal overrides for compatibility
  address: z.string().optional().or(z.literal("")), // maps to presentAddress if needed

  // Section 4: Emergency Contact
  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyContactRelation: z.string().optional().or(z.literal("")),
  emergencyContactMobile: z.string().optional().or(z.literal("")),

  // Docs (Cloudinary URLs)
  photoUrl: z.string().optional().or(z.literal("")),
  documentUrl: z.string().optional().or(z.literal("")),
  
  beneficiaryPhoto: z.string().optional().or(z.literal("")),
  nidOrBirthCertificate: z.string().optional().or(z.literal("")),
  
  // Base64 document uploads
  photoBase64: z.string().optional().or(z.literal("")),
  idDocumentType: z.enum(["NID", "BIRTH_CERTIFICATE"]).optional(),
  nidFrontBase64: z.string().optional().or(z.literal("")),
  nidBackBase64: z.string().optional().or(z.literal("")),
  birthCertificateBase64: z.string().optional().or(z.literal("")),
  signatureBase64: z.string().optional().or(z.literal("")),

  memberId: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  relationToMember: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),

  // Required for backend mapping
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

export type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>


