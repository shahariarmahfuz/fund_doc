"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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
import { receiveDonation } from "../actions"
import { format } from "date-fns"
import { MemberCombobox, type ComboboxMember } from "@/components/member-combobox"
import { GroupCombobox } from "@/components/group-combobox"
import { UserCheck, Users } from "lucide-react"

const formSchema = z.object({
  sourceType: z.enum(["MEMBER", "DONOR"]),
  memberId: z.string().optional(),
  donorId: z.string().optional(),
  groupId: z.string().min(1, "Group is required"),
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  date: z.string().min(1, "Date is required"),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.sourceType === "MEMBER") {
    if (!data.memberId || data.memberId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberId"],
        message: "Foundation Member is required",
      })
    }
  } else if (data.sourceType === "DONOR") {
    if (!data.donorId || data.donorId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["donorId"],
        message: "Donor is required",
      })
    }
  }
})

type DonationFormValues = z.infer<typeof formSchema>

export function DonationForm({ 
  donors, 
  members = [],
  groups 
}: { 
  donors: { id: string, fullName: string, donorId: string, mobile: string }[],
  members?: ComboboxMember[],
  groups: { id: string, name: string, code?: string, isFoundationGroup?: boolean }[] 
}) {
    const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(formSchema) as Resolver<DonationFormValues>,
    defaultValues: {
      sourceType: "DONOR",
      memberId: "",
      donorId: "",
      groupId: "",
      amount: 0,
      date: "",
      remarks: "",
    }
  })

  const sourceType = form.watch("sourceType")
  const selectedMemberId = form.watch("memberId")

  const selectedMember = members.find(m => m.id === selectedMemberId)

  useEffect(() => {
    form.setValue("date", format(new Date(), "yyyy-MM-dd"))
  }, [form])

  const handleMemberSelect = (memberId: string) => {
    form.setValue("memberId", memberId)
    const mem = members.find(m => m.id === memberId)
    if (mem && mem.group?.name) {
      const matchGroup = groups.find(g => g.name === mem.group?.name)
      if (matchGroup) {
        form.setValue("groupId", matchGroup.id)
      }
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    const res = await receiveDonation({
      sourceType: values.sourceType,
      memberId: values.sourceType === "MEMBER" ? values.memberId : null,
      donorId: values.sourceType === "DONOR" ? values.donorId : null,
      groupId: values.groupId,
      amount: values.amount,
      date: values.date,
      remarks: values.remarks,
    })

    setIsSubmitting(false)

    if (res.success) {
      toast.success("Donation has been successfully received")
      router.push("/donors/donations")
    } else if (res && 'error' in res) {
      toast.error(String(res.error))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{"Receive Donation"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. Donation Source Field (Required) */}
            <FormField
              control={form.control}
              name="sourceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="font-semibold text-sm">
                    {"Donation Source *"}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(val) => {
                        field.onChange(val)
                        if (val === "MEMBER") {
                          form.setValue("donorId", "")
                        } else {
                          form.setValue("memberId", "")
                        }
                      }}
                      value={field.value}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <FormControl>
                          <RadioGroupItem value="DONOR" />
                        </FormControl>
                        <Label className="font-medium cursor-pointer flex items-center gap-2 w-full text-sm">
                          <Users className="w-4 h-4 text-primary" />
                          <span>{"Non-member / Donor"}</span>
                        </Label>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <FormControl>
                          <RadioGroupItem value="MEMBER" />
                        </FormControl>
                        <Label className="font-medium cursor-pointer flex items-center gap-2 w-full text-sm">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>{"Foundation Member"}</span>
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Conditional Fields */}
              {sourceType === "MEMBER" ? (
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>{"Foundation Member *"}</FormLabel>
                      <FormControl>
                        <MemberCombobox
                          members={members}
                          value={field.value}
                          onChange={(val) => handleMemberSelect(val)}
                        />
                      </FormControl>
                      <FormMessage />

                      {/* Display selected member's name and member ID */}
                      {selectedMember && (
                        <div className="mt-3 p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">{"Selected Member Info"}</p>
                            <p className="font-bold text-sm text-foreground mt-0.5">{selectedMember.fullName || "-"}</p>
                            <p className="text-xs text-muted-foreground">{"ID:"} {selectedMember.memberId || "-"}</p>
                          </div>
                          {selectedMember.group?.name && (
                            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded">
                              {selectedMember.group.name}
                            </span>
                          )}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="donorId"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>{"Donor *"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={"Select the donor"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {donors.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.fullName} ({d.donorId}) - {d.mobile}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>{"Foundation Group"}</FormLabel>
                    <FormControl>
                      <GroupCombobox
                        groups={groups.map((g) => ({
                          id: g.id,
                          name: g.name,
                          code: g.code || g.name.substring(0, 3).toUpperCase(),
                          isFoundationGroup: g.isFoundationGroup,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={"Select the foundation group"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{"Amount"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value || ""} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{"Date"}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>{"Remarks"}</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {"Cancel"}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Receive Donation"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
