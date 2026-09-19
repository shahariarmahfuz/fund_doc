"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createDonor, updateDonor } from "../actions"
import { apiClient } from "@/lib/api/client"

// Removed import

const formSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  mobile: z.string().optional().refine(val => !val || /^[0-9+\-\s()]+$/.test(val), {
    message: "Invalid mobile number format"
  }),
  address: z.string().optional(),
  nationalId: z.string().optional(),
  notes: z.string().optional(),
  documentUrl: z.string().optional(),
})

export function DonorForm({ mode = "create", donor = null }: { mode?: "create" | "edit", donor?: any }) {
      const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: donor?.fullName || "",
      mobile: donor?.mobile || "",
      address: donor?.address || "",
      nationalId: donor?.nationalId || "",
      notes: donor?.notes || "",
      documentUrl: "", 
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    const sanitizedMobile = values.mobile?.trim() || undefined
    const sanitizedNationalId = values.nationalId?.trim() || undefined
    const sanitizedAddress = values.address?.trim() || undefined
    const sanitizedNotes = values.notes?.trim() || undefined

    const payload = {
      fullName: values.fullName.trim(),
      mobile: sanitizedMobile,
      address: sanitizedAddress,
      nationalId: sanitizedNationalId,
      notes: sanitizedNotes,
      documents: values.documentUrl ? [{
        title: "Donor Document",
        secureUrl: values.documentUrl,
        type: "IMAGE"
      }] : []
    }

    let res: { success: boolean; error?: string; donor?: any }
    try {
      if (mode === "create") {
        res = await createDonor(payload)
      } else {
        res = await updateDonor(donor.id, payload)
      }
    } catch (actionErr: any) {
      const errorMsg = String(actionErr?.message || actionErr || "")
      if (
        errorMsg.includes("was not found on the server") ||
        errorMsg.includes("failed-to-find-server-action") ||
        errorMsg.includes("Server Action")
      ) {
        try {
          const clientData = {
            fullName: payload.fullName,
            mobile: sanitizedMobile || null,
            address: sanitizedAddress || null,
            nationalId: sanitizedNationalId || null,
            notes: sanitizedNotes || null,
          }
          if (mode === "create") {
            const created = await apiClient.donors.create(clientData)
            res = { success: true, donor: created }
          } else {
            const updated = await apiClient.donors.update(donor.id, clientData)
            res = { success: true, donor: updated }
          }
        } catch (apiErr: any) {
          res = { success: false, error: apiErr?.message || "Failed to save donor" }
        }
      } else {
        res = { success: false, error: errorMsg }
      }
    }

    setIsSubmitting(false)

    if (res.success) {
      toast.success(mode === "create" ? "New donor successfully created" : "Donor information successfully updated")
      if (res.donor?.id) {
        router.push(`/donors/${res.donor.id}`)
      } else {
        router.push("/donors/manage")
      }
    } else {
      toast.error(res.error || "Failed to save donor")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{"Donor Info"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Full Name"} *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
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
                                  <FormItem>
                                    <FormLabel>{"Mobile Number"}</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
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
                                    <FormLabel>{"National Identity Card (NID/Birth Cert)"}</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => {
                  return ((
                                  <FormItem className="col-span-1 md:col-span-2">
                                    <FormLabel>{"Address"}</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => {
                  return ((
                                  <FormItem className="col-span-1 md:col-span-2">
                                    <FormLabel>{"Notes"}</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{"Document"}</CardTitle>
          </CardHeader>
          <CardContent>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {"Cancel"}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
