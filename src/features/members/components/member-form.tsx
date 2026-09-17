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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { memberSchema, baseMemberSchema, type MemberFormValues, type BaseMemberFormValues } from "../schema";
import { GroupCombobox } from "@/components/group-combobox";
import { createMember, updateMember, deleteMemberDocument } from "../actions";
import type { Member } from "@/types/models";
import { formatDate } from "@/lib/format";
import Link from "next/link";

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

export function MemberForm({ 
  groups, 
  mode = "create", 
  memberId, 
  initialData,
  member,
  onSubmitAction
}: { 
  groups: any[], 
  mode?: "create" | "edit" | "request",
  memberId?: string,
  initialData?: Partial<any>,
  member?: any,
  onSubmitAction?: (data: any) => Promise<{success: boolean, error?: string, applicationNumber?: string, id?: string}>
}) {
      const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; applicationNumber: string } | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    section3: true,
    section4: true,
    section5: true,
    section6: true,
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const nidFrontInputRef = useRef<HTMLInputElement>(null);
  const nidBackInputRef = useRef<HTMLInputElement>(null);
  const bcInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  let parsedReference = { name: "", mobile: "", relation: "" };
  try {
    if (member?.reference) {
      parsedReference = JSON.parse(member.reference);
    }
  } catch (e) {}

  const schema = mode === "request" ? baseMemberSchema : memberSchema;

  const baseDefaults = {
    groupId: member?.groupId || "",
    memberId: member?.memberId || "",
    joinDate: member?.joinDate ? new Date(member.joinDate).toISOString().split('T')[0] : "",
    fullName: member?.fullName || "",
    fatherName: member?.fatherName || "",
    motherName: member?.motherName || "",
    gender: member?.gender?.toLowerCase() || "",
    dob: member?.dob ? new Date(member.dob).toISOString().split('T')[0] : "",
    nationalId: member?.nationalId || "",
    occupation: member?.occupation || "",
    education: member?.education || "",
    maritalStatus: member?.maritalStatus?.toLowerCase() || "",
    presentAddress: member?.presentAddress || "",
    permanentAddress: member?.permanentAddress || "",
    mobile: member?.mobile || "",
    altMobile: member?.altMobile || "",
    phone: member?.phone || "",
    email: member?.email || "",
    bloodGroup: member?.bloodGroup || "",
    position: member?.position || "GENERAL_MEMBER",
    
    emergencyContactName: member?.emergencyContactName || "",
    emergencyContactMobile: member?.emergencyContactMobile || "",
    emergencyContactRelation: member?.emergencyContactRelation || "",
    
    referenceName: parsedReference.name || "",
    referenceMobile: parsedReference.mobile || "",
    referenceRelation: parsedReference.relation || "",
    
    reasonForJoining: member?.reasonForJoining || "",

    idDocumentType: member?.idDocumentType || "NID",
    photoBase64: "",
    signatureBase64: "",
    nidFrontBase64: "",
    nidBackBase64: "",
    birthCertificateBase64: "",
  };

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...baseDefaults,
      ...(initialData || {}),
    },
  });

  const getDoc = (title: string) => member?.documents?.find((d: any) => d.title === title);
  
  const existingPhoto = getDoc("Member Photo")?.secureUrl;
  const existingSignature = getDoc("Signature")?.secureUrl;
  const existingNidFront = getDoc("NID Front")?.secureUrl || (getDoc("National ID")?.secureUrl && form.watch("idDocumentType") === "NID" ? getDoc("National ID")?.secureUrl : null);
  const existingNidBack = getDoc("NID Back")?.secureUrl;
  const existingBC = getDoc("Birth Certificate")?.secureUrl;

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      if (mode === "request" && onSubmitAction) {
        const res = await onSubmitAction(data);
        if (res.success && res.applicationNumber) {
          toast.success("Submitted!");
          setSuccessData({ id: res.id!, applicationNumber: res.applicationNumber });
        } else {
          toast.error(res.error || "Failed to submit application");
        }
      } else {
        const res = mode === "edit" ? await updateMember(memberId!, data) : await createMember(data);
        if (res.success) {
          toast.success(mode === "edit" ? "Member updated successfully" : "Member added successfully");
          router.push("/members/manage");
        } else {
          toast.error(res.error || "Failed to save member");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
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

  const handleDeleteDocument = async (title: string, fieldName: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    // Clear local form state
    form.setValue(fieldName, "");

    // If it's an existing document in edit mode, delete it via server action
    if (mode === "edit" && memberId) {
      try {
        const res = await deleteMemberDocument(memberId, title);
        if (res.success) {
          toast.success("Member deleted successfully");
          router.refresh(); // Refresh page to get updated DB state
        } else {
          toast.error(res.error || "Failed to delete document");
        }
      } catch (e) {
        toast.error("An unexpected error occurred");
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
    field: string;
    existingUrl?: string | null;
    dbTitle: string;
  }) => {
    const watchVal = form.watch(field) as string;
    const docObj = getDoc(dbTitle) || (dbTitle === "NID Front" && getDoc("National ID"));
    
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
            <p className="text-sm font-medium">{"Upload Photo"}</p>
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
        {successData && mode === "request" ? (
          <Card className="w-full max-w-2xl mx-auto mt-8 mb-16 shadow-lg border-green-200">
            <CardHeader className="bg-green-50/50 border-b border-green-100">
              <CardTitle className="text-2xl text-center text-green-700">
                {"Application Submitted Successfully!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pt-8 pb-10">
              <div className="text-center space-y-3">
                <p className="text-muted-foreground text-lg">{"Your application number is:"}</p>
                <div className="bg-muted px-8 py-4 rounded-xl border">
                  <p className="text-5xl font-mono font-bold tracking-wider text-primary">{successData.applicationNumber}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4 max-w-sm mx-auto">
                  {"Please save this number to check your application status later."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-6">
                <Button asChild variant="default" size="lg">
                  <Link href="/member-request/status">
                    {"Check Application Status"}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={() => {
                  form.reset();
                  setSuccessData(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                  {"Submit Another Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-24 max-w-5xl mx-auto space-y-6">
        
        {mode !== "request" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">{"Member ID"}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. M-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="joinDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">{"Join Date"}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <FormLabel className="text-lg mb-2">{"Group *"}</FormLabel>
                  <FormControl>
                    <GroupCombobox
                      groups={groups.map((g) => ({
                        id: g.id,
                        name: g.name,
                        code: g.code,
                        isFoundationGroup: g.isFoundationGroup,
                        memberSignupEnabled: g.memberSignupEnabled,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={"Select a group"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "edit" && (
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">{"Position"}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "GENERAL_MEMBER"}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["PRESIDENT", "VICE_PRESIDENT", "GENERAL_SECRETARY", "JOINT_SECRETARY", "ORGANIZING_SECRETARY", "TREASURER", "ADVISOR", "EXECUTIVE_MEMBER", "GENERAL_MEMBER"].map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {(({ PRESIDENT: "President", VICE_PRESIDENT: "Vice President", GENERAL_SECRETARY: "General Secretary", JOINT_SECRETARY: "Joint Secretary", ORGANIZING_SECRETARY: "Organizing Secretary", TREASURER: "Treasurer", ADVISOR: "Advisor", EXECUTIVE_MEMBER: "Executive Member", GENERAL_MEMBER: "General Member" } as Record<string, string>)[pos] || pos.replace("_", " "))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        ) : (
          <SectionCard title={"Group Selection"} isOpen={true} onToggle={() => {}}>
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Group"} *</FormLabel>
                  <FormControl>
                    <GroupCombobox
                      groups={groups.map((g) => ({
                        id: g.id,
                        name: g.name,
                        code: g.code,
                        isFoundationGroup: g.isFoundationGroup,
                        memberSignupEnabled: g.memberSignupEnabled,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={"Select Group"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>
        )}

        {/* SECTION 1: Personal Information */}
        <SectionCard title={"1. Personal Information"} isOpen={openSections.section1} onToggle={() => toggleSection("section1")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Full Name *"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Member's full name"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="fatherName"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Father's Name"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Father's Name"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="motherName"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Mother's Name"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Mother's Name"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Date of Birth"}</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Gender"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue placeholder={"Select Gender"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="male">{"Male"}</SelectItem>
                      <SelectItem value="female">{"Female"}</SelectItem>
                      <SelectItem value="other">{"Other"}</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"National ID / Birth Certificate Number"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"NID or BC Number"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Occupation / Workplace"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Occupation or Workplace"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="education"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Education"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Education"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="bloodGroup"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Blood Group"}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={"Select Blood Group"} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="A+">{"A+"}</SelectItem>
                                    <SelectItem value="A-">{"A-"}</SelectItem>
                                    <SelectItem value="B+">{"B+"}</SelectItem>
                                    <SelectItem value="B-">{"B-"}</SelectItem>
                                    <SelectItem value="AB+">{"AB+"}</SelectItem>
                                    <SelectItem value="AB-">{"AB-"}</SelectItem>
                                    <SelectItem value="O+">{"O+"}</SelectItem>
                                    <SelectItem value="O-">{"O-"}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Marital Status"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue placeholder={"Select Marital Status"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="single">{"Single"}</SelectItem>
                      <SelectItem value="married">{"Married"}</SelectItem>
                      <SelectItem value="divorced">{"Divorced"}</SelectItem>
                      <SelectItem value="widowed">{"Widowed"}</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Mobile Number"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Mobile Number"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField control={form.control} name="altMobile" render={({ field }) => (
              <FormItem><FormLabel>{"Alternative Mobile"}</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>{"Phone"}</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Email (Optional)"}</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder={"example@email.com"} {...field} />
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
                                      <Textarea placeholder={"Enter present address"} {...field} />
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
                                      <Textarea placeholder={"Enter permanent address"} {...field} />
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
        <SectionCard title={"2. Emergency Contact"} isOpen={openSections.section2} onToggle={() => toggleSection("section2")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Emergency Contact Name"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Contact person name" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactRelation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Relationship"}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Father / Brother" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactMobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Emergency Mobile Number"}</FormLabel>
                  <FormControl>
                    <Input placeholder="017XXXXXXXX" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SectionCard>

        {/* SECTION 3: Reference */}
        <SectionCard title={"3. Reference"} isOpen={openSections.section3} onToggle={() => toggleSection("section3")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="referenceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Reference Name"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Reference person name" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceMobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Reference Mobile Number"}</FormLabel>
                  <FormControl>
                    <Input placeholder="017XXXXXXXX" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceRelation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Relationship"}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Friend / Colleague" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SectionCard>

        {/* SECTION 4: Commitment */}
        <SectionCard title={"4. Commitment"} isOpen={openSections.section4} onToggle={() => toggleSection("section4")}>
          <div className="p-6 bg-muted/20 rounded-md border text-base text-foreground leading-relaxed">
            {"I declare that I will try to work as a responsible member while respecting the foundation's purpose, ideals, and policies. I will cooperate in the humanitarian activities of the foundation according to my ability and will maintain the organization's discipline, mutual respect, and values of brotherhood, Insha'Allah."}</div>
        </SectionCard>

        {/* SECTION 5: Documents */}
        <SectionCard title={"5. Documents"} isOpen={openSections.section5} onToggle={() => toggleSection("section5")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <UploadBox 
              title={"Member Photo"} 
              subtext={"JPEG, PNG, or JPG"} 
              inputRef={photoInputRef} 
              field="photoBase64" 
              dbTitle="Member Photo"
              existingUrl={existingPhoto} 
            />
            
            <UploadBox 
              title={"Signature (Optional)"} 
              subtext={"JPEG, PNG, or JPG"} 
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
                                    <FormLabel className="text-base font-semibold">{"Document Type"}</FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={(val) => field.onChange(val)}
                                        value={field.value || "NID"}
                                        className="flex space-x-6 mt-2"
                                      >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value="NID" />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {"National ID (NID)"}</FormLabel>
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
                  title={"National ID (Front)"} 
                  subtext={"JPEG, PNG, or JPG"} 
                  inputRef={nidFrontInputRef} 
                  field="nidFrontBase64" 
                  dbTitle="NID Front"
                  existingUrl={existingNidFront} 
                />
                <UploadBox 
                  title={"National ID (Back)"} 
                  subtext={"JPEG, PNG, or JPG"} 
                  inputRef={nidBackInputRef} 
                  field="nidBackBase64" 
                  dbTitle="NID Back"
                  existingUrl={existingNidBack} 
                />
              </>
            ) : (
              <UploadBox 
                title={"Birth Certificate"} 
                subtext={"JPEG, PNG, or JPG"} 
                inputRef={bcInputRef} 
                field="birthCertificateBase64" 
                dbTitle="Birth Certificate"
                existingUrl={existingBC} 
              />
            )}

          </div>
        </SectionCard>

        {/* SECTION 6: Additional Information */}
        <SectionCard title={"Additional Information"} isOpen={openSections.section6} onToggle={() => toggleSection("section6")}>
          <FormField control={form.control} name="reasonForJoining" render={({ field }) => (
            <FormItem><FormLabel>{"Reason for Joining"}</FormLabel><FormControl><Textarea {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
        </SectionCard>

        {/* ACTIONS */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          {mode !== "request" && (
            <Button variant="outline" type="button" onClick={() => router.push("/members/manage")}>
              {"Cancel"}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (mode === "request" ? "Submitting..." : "Saving...")
              : (mode === "request" ? "Submit Application" : "Save")}
          </Button>
        </div>
      </form>
      )}
    </Form>
  );
}
