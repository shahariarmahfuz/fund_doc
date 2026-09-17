"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, UploadCloud, X } from "lucide-react";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { beneficiarySchema, type BeneficiaryFormValues } from "../schema";
import { createBeneficiary, updateBeneficiary, deleteBeneficiaryDocument } from "../actions";
import type { Beneficiary } from "@/types/models";
import { formatDate } from "@/lib/format";

const SectionCard = ({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
            return ((
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card className="mb-6 shadow-sm border-muted">
          <CardHeader className="py-4 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="w-9 p-0 hover:bg-transparent">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="sr-only">{"Toggle"}</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-6">{children}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    ));
    };

export function BeneficiaryForm({ 
  mode = "create", 
  beneficiaryId, 
  initialData,
  beneficiary
}: { 
  members?: any[], 
  mode?: "create" | "edit",
  beneficiaryId?: string,
  initialData?: Partial<BeneficiaryFormValues>,
  beneficiary?: any
}) {
      const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    section3: true,
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const nidFrontInputRef = useRef<HTMLInputElement>(null);
  const nidBackInputRef = useRef<HTMLInputElement>(null);
  const bcInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const baseDefaults: BeneficiaryFormValues = {
    fullName: beneficiary?.fullName || "",
    fatherOrHusbandName: beneficiary?.fatherOrHusbandName || "",
    nationalId: beneficiary?.nationalId || "",
    mobile: beneficiary?.mobile || "",
    presentAddress: beneficiary?.presentAddress || "",
    permanentAddress: beneficiary?.permanentAddress || "",
    
    emergencyContactName: beneficiary?.emergencyContactName || "",
    emergencyContactRelation: beneficiary?.emergencyContactRelation || "",
    emergencyContactMobile: beneficiary?.emergencyContactMobile || "",
    
    status: beneficiary?.status || "ACTIVE",
    
    idDocumentType: beneficiary?.idDocumentType || "NID",
    photoBase64: "",
    signatureBase64: "",
    nidFrontBase64: "",
    nidBackBase64: "",
    birthCertificateBase64: "",
  };

  const form = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      ...baseDefaults,
      ...(initialData || {}),
    },
  });

  const getDoc = (title: string) => beneficiary?.documents?.find((d: any) => d.title === title);
  
  const existingPhoto = getDoc("Beneficiary Photo")?.secureUrl || beneficiary?.beneficiaryPhoto;
  const existingSignature = getDoc("Signature")?.secureUrl;
  
  // Try to find exact titles, fallback to legacy if "NID Front" missing but legacy exists
  const legacyId = beneficiary?.nidOrBirthCertificate;
  const existingNidFront = getDoc("NID Front")?.secureUrl || (legacyId && form.watch("idDocumentType") === "NID" ? legacyId : null);
  const existingNidBack = getDoc("NID Back")?.secureUrl;
  const existingBC = getDoc("Birth Certificate")?.secureUrl || (legacyId && form.watch("idDocumentType") === "BIRTH_CERTIFICATE" ? legacyId : null);

  async function onSubmit(data: BeneficiaryFormValues) {
    setIsSubmitting(true);
    try {
      const res = mode === "edit" ? await updateBeneficiary(beneficiaryId!, data) : await createBeneficiary(data);
      if (res.success) {
        toast.success(mode === "edit" ? "Beneficiary updated successfully" : "Beneficiary created successfully");
        router.push("/beneficiaries");
      } else {
        toast.error(res.error || "Failed to save beneficiary");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof BeneficiaryFormValues
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDocument = async (title: string, fieldName: keyof BeneficiaryFormValues) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    // Clear local form state
    form.setValue(fieldName, "");

    // If it's an existing document in edit mode, delete it via server action
    if (mode === "edit" && beneficiaryId) {
      try {
        const res = await deleteBeneficiaryDocument(beneficiaryId, title);
        if (res.success) {
          toast.success("Document deleted successfully");
          router.refresh(); // Refresh page to get updated DB state
        } else {
          toast.error(res.error || "Failed to delete document");
        }
      } catch (e) {
        toast.error("An error occurred.");
      }
    }
  };

  const UploadBox = ({ 
    title, 
    subtext, 
    inputRef, 
    field, 
    existingUrl,
    dbTitle
  }: { 
    title: string; 
    subtext: string; 
    inputRef: React.RefObject<HTMLInputElement | null>;
    field: keyof BeneficiaryFormValues;
    existingUrl?: string | null;
    dbTitle: string;
  }) => {
    const watchVal = form.watch(field) as string;
    const docObj = getDoc(dbTitle);
    
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-base mb-2">{title}</h3>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={inputRef}
          onChange={(e) => handleFileChange(e, field)}
        />
        
        {!watchVal && !existingUrl ? (
          <div 
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium">{"Click to upload"}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative border rounded-lg overflow-hidden h-48 w-full group bg-muted/10">
              <Image 
                src={watchVal || existingUrl!} 
                alt={"Preview"} 
                fill 
                className="object-contain" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  {"Replace"}</Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    return (handleDeleteDocument(dbTitle, field));
                  }}
                >
                  {"Delete"}</Button>
              </div>
            </div>
            {!watchVal && existingUrl && docObj && (
              <div className="text-center text-xs text-muted-foreground">
                {"Uploaded on: "}{formatDate(docObj.createdAt)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-24 max-w-5xl mx-auto space-y-6">
        
        {mode === "edit" && beneficiary && (
          <Card className="bg-muted/30">
            <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{"Beneficiary ID"}</p>
                <p className="font-mono font-medium">{beneficiary.beneficiaryId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{"Created At"}</p>
                <p className="font-medium">{formatDate(beneficiary.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 1: Personal Information */}
        <SectionCard title={"Personal Information"} isOpen={openSections.section1} onToggle={() => toggleSection("section1")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => {
                return ((
                              <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>{"Full Name"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Enter full name"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="fatherOrHusbandName"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Father/Husband's Name"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Enter father/husband's name"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"National ID"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Enter National ID"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => {
                return ((
                              <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>{"Mobile"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Enter mobile number"} className="md:w-1/2" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="presentAddress"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Present Address"}</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder={"Enter present address"} className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="permanentAddress"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Permanent Address"}</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder={"Enter permanent address"} className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
            </div>
          </div>
        </SectionCard>

        {/* SECTION 2: Emergency Contact */}
        <SectionCard title={"Emergency Contact"} isOpen={openSections.section2} onToggle={() => toggleSection("section2")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Name"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Enter contact name"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="emergencyContactRelation"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Relation"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Enter relation"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="emergencyContactMobile"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Mobile"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Mobile"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
          </div>
        </SectionCard>

        {/* SECTION 3: Documents */}
        <SectionCard title={"Documents"} isOpen={openSections.section3} onToggle={() => toggleSection("section3")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <UploadBox 
              title={"Beneficiary Photo"} 
              subtext={"JPEG, PNG or JPG"} 
              inputRef={photoInputRef} 
              field="photoBase64" 
              dbTitle="Beneficiary Photo"
              existingUrl={existingPhoto} 
            />
            
            <UploadBox 
              title={"Signature"} 
              subtext={"JPEG, PNG or JPG"} 
              inputRef={signatureInputRef} 
              field="signatureBase64" 
              dbTitle="Signature"
              existingUrl={existingSignature} 
            />

            <div className="md:col-span-2 border-t pt-6 mt-2">
              <FormField
                control={form.control}
                name="idDocumentType"
                render={({ field }) => {
                  return ((
                                  <FormItem className="mb-6">
                                    <FormLabel className="text-base font-semibold">{"ID Document Type"}</FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={(val) => {
                                          field.onChange(val);
                                          // Optional: Clear corresponding unselected fields if user switches
                                        }}
                                        value={field.value || "NID"}
                                        className="flex space-x-6 mt-2"
                                      >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value="NID" />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {"NID"}</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value="BIRTH_CERTIFICATE" />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {"Birth Certificate"}</FormLabel>
                                        </FormItem>
                                      </RadioGroup>
                                    </FormControl>
                                  </FormItem>
                                ));
                }}
              />
            </div>

            {form.watch("idDocumentType") === "NID" ? (
              <>
                <UploadBox 
                  title={"NID Front"} 
                  subtext={"JPEG, PNG or JPG"} 
                  inputRef={nidFrontInputRef} 
                  field="nidFrontBase64" 
                  dbTitle="NID Front"
                  existingUrl={existingNidFront} 
                />
                <UploadBox 
                  title={"NID Back"} 
                  subtext={"JPEG, PNG or JPG"} 
                  inputRef={nidBackInputRef} 
                  field="nidBackBase64" 
                  dbTitle="NID Back"
                  existingUrl={existingNidBack} 
                />
              </>
            ) : (
              <UploadBox 
                title={"Birth Certificate"} 
                subtext={"JPEG, PNG or JPG"} 
                inputRef={bcInputRef} 
                field="birthCertificateBase64" 
                dbTitle="Birth Certificate"
                existingUrl={existingBC} 
              />
            )}

          </div>
        </SectionCard>

        {/* ACTIONS */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button variant="outline" type="button" onClick={() => router.push("/beneficiaries/manage")}>
            {"Cancel"}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
