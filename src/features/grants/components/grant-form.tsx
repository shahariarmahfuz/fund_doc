"use client"
import { getNow, formatDateInput } from "@/lib/date";

import { useState, useEffect, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, UploadCloud, X, FileText, Trash2, Plus } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import { createGrant, updateGrant } from "../actions"
import { grantSchema, type GrantFormValues } from "../schema"
import { uploadDocument, deleteDocumentById } from "@/features/documents/actions"
import { MemberCombobox } from "@/components/member-combobox"
import { GroupCombobox } from "@/components/group-combobox"

const SectionCard = ({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
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
    }

export function GrantForm({ 
  beneficiaries, 
  groups,
  initialData,
  initialDocuments = [],
  grantId
}: { 
  beneficiaries: { id: string; beneficiaryId: string; fullName: string | null;  }[]
  groups: { id: string; name: string; code: string }[]
  initialData?: Partial<GrantFormValues>
  initialDocuments?: any[]
  grantId?: string
}) {
      const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEditing = !!grantId

  // Sections State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    section3: true,
  })

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Documents State
  const [existingDocs, setExistingDocs] = useState<any[]>(initialDocuments)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const baseDefaults: GrantFormValues = {
    beneficiaryId: "",
    grantDate: formatDateInput(getNow()),
    amount: 0,
    grantReason: "",
    comment: "",
    allocations: [{ groupId: "", amount: 0 }]
  }

  const defaultValues: GrantFormValues = {
    ...baseDefaults,
    ...(initialData || {})
  }

  const form = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema as any),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    name: "allocations",
    control: form.control,
  })

  const rawAmount = form.watch("amount")
  const currentAmount = Number(rawAmount) || 0
  const currentAllocations = form.watch("allocations")
  const totalAllocated = currentAllocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0)

  // Document Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setPendingFiles(prev => [...prev, ...newFiles])
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingDoc = async (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      const res = await deleteDocumentById(docId)
      if (res.success) {
        toast.success("Document deleted successfully")
        setExistingDocs(prev => prev.filter(d => d.id !== docId))
      } else {
        toast.error("Failed to delete document: " + res.error)
      }
    }
  }

  async function onSubmit(data: GrantFormValues) {
    setLoading(true)
    let res;
    if (isEditing) {
      res = await updateGrant(grantId, data)
    } else {
      res = await createGrant(data)
    }
    
    if (res.success) {
      const currentGrantId = isEditing ? grantId : (res as any).data?.id
      
      // Upload pending files if any
      if (currentGrantId && pendingFiles.length > 0) {
        toast.info("Uploading documents...")
        let uploadErrors = 0
        for (const file of pendingFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("title", file.name)
          formData.append("targetType", "GRANT")
          formData.append("entityId", currentGrantId)
          
          const uploadRes = await uploadDocument(formData)
          if (!uploadRes.success) uploadErrors++
        }
        
        if (uploadErrors > 0) {
          toast.error(`${uploadErrors}` + " document(s) failed to upload.")
        }
      }

      toast.success(isEditing ? "Sadaqah updated successfully" : "Sadaqah created successfully")
      router.push(`/grants/${currentGrantId || ""}`)
    } else {
      toast.error(res.error || "Failed to process Sadaqah")
    }
    setLoading(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-24 max-w-5xl mx-auto space-y-6">
        
        {/* SECTION 1: Beneficiary */}
        <SectionCard title={"Beneficiary Selection"} isOpen={openSections.section1} onToggle={() => toggleSection("section1")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="beneficiaryId"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Beneficiary"}</FormLabel>
                                <FormControl>
                                  <MemberCombobox
                                    members={beneficiaries}
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
          </div>
        </SectionCard>

        {/* SECTION 2: Sadaqah Information */}
        <SectionCard title={"Sadaqah Information"} isOpen={openSections.section2} onToggle={() => toggleSection("section2")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="grantDate"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Sadaqah Date"}</FormLabel>
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
              name="amount"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Sadaqah Amount"}</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? "" : v); }} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="grantReason"
              render={({ field }) => {
                return ((
                              <FormItem className="md:col-span-2">
                                <FormLabel>{"Reason for Sadaqah"}</FormLabel>
                                <FormControl>
                                  <Textarea placeholder={"Please specify the reason"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => {
                return ((
                              <FormItem className="md:col-span-2">
                                <FormLabel>{"Remarks"}</FormLabel>
                                <FormControl>
                                  <Textarea placeholder={"Any additional notes"} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />

            <div className="md:col-span-2 mt-4">
              <h4 className="text-sm font-medium mb-3">{"Funding Sources"}</h4>
              <div className="space-y-4">
                {fields.map((field, index) => {
                  return ((
                                  <div key={field.id} className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-md bg-muted/5">
                                    <FormField
                                      control={form.control}
                                      name={`allocations.${index}.groupId`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1 w-full">
                                          <FormLabel>{"Funding Group"}</FormLabel>
                                          <FormControl>
                                            <GroupCombobox
                                              groups={groups.map((g) => ({
                                                id: g.id,
                                                name: g.name,
                                                code: g.code,
                                                isFoundationGroup: (g as any).isFoundationGroup,
                                              }))}
                                              value={field.value}
                                              onChange={field.onChange}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`allocations.${index}.amount`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1 w-full">
                                          <FormLabel>{"Allocated Amount"}</FormLabel>
                                          <FormControl>
                                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? "" : v); }} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="icon" 
                                      className="mt-2 sm:mt-0"
                                      onClick={() => remove(index)}
                                      disabled={fields.length === 1}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ));
                })}
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ groupId: "", amount: 0 })}>
                    <Plus className="mr-2 h-4 w-4" /> {"Add Funding Source"}</Button>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-2">{"Total Allocation"}</span>
                    <span className={`font-bold ${totalAllocated !== currentAmount ? 'text-destructive' : 'text-primary'}`}>
                      ৳{totalAllocated.toFixed(2)} {" / \u09f3"}{currentAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {form.formState.errors.allocations?.root && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.allocations.root.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* SECTION 3: Documents */}
        <SectionCard title={"Supporting Document (Optional)"} isOpen={openSections.section3} onToggle={() => toggleSection("section3")}>
          <div className="space-y-4">
            
            {/* Existing Documents List */}
            {existingDocs.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium">{"Existing Documents"}</h4>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {existingDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded bg-muted/20">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm truncate hover:underline" title={doc.title}>
                          {doc.title}
                        </a>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteExistingDoc(doc.id)} className="h-6 w-6 p-0 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Files List */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium">{"New Documents"}</h4>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {pendingFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded bg-primary/5 border-primary/20">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm truncate" title={file.name}>{file.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removePendingFile(idx)} className="h-6 w-6 p-0 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors"
                 onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{"Upload Document"}</p>
              <p className="text-xs text-muted-foreground mt-1">{"PDF, JPG, PNG, WEBP (Max 5MB)"}</p>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,image/jpeg,image/png,image/webp"
              />
            </div>
            
          </div>
        </SectionCard>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button variant="outline" type="button" onClick={() => router.push("/grants/manage")}>
            {"Cancel"}</Button>
          <Button type="submit" disabled={loading || totalAllocated !== currentAmount}>
            {loading ? "Saving..." : (isEditing ? "Update Sadaqah" : "Save Sadaqah")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
