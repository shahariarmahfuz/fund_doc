"use client"
import { getNow } from "@/lib/date";

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createContribution } from "../actions"
import { contributionSchema, type ContributionFormValues } from "../schema"
import { MemberCombobox } from "@/components/member-combobox"


export function ContributionForm({ members }: { members: { id: string; memberId: string; fullName: string | null; group: { name: string; code: string } | null }[] }) {
      const router = useRouter()
  const [loading, setLoading] = useState(false)

  const defaultValues: Partial<ContributionFormValues> = {
    memberId: "",
    month: 1,
    year: 2026,
    amount: 0,
    paymentDate: "",
    paymentMethod: "CASH",
    referenceNumber: "",
    notes: "",
    status: "PAID",
    isAdditional: false,
  }

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues,
  })

  
  useEffect(() => {
    form.setValue("month", getNow().getMonth() + 1)
    form.setValue("year", getNow().getFullYear())
    form.setValue("paymentDate", getNow().toLocaleDateString("en-CA"))
  }, [form])

  async function onSubmit(data: ContributionFormValues) {
    setLoading(true)
    const res = await createContribution(data)
    if (res.success) {
      toast.success("Contribution successfully saved")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to save contribution")
    }
    setLoading(false)
  }

  return (
    <Card className="mb-6 shadow-sm border-muted max-w-5xl mx-auto">
      <CardHeader className="py-4 border-b bg-muted/10">
        <CardTitle className="text-lg font-semibold">{"New Contribution"}</CardTitle>
        <CardDescription>{"Record a new monthly or additional contribution"}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => {
                  return ((
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>{"Select Member *"}</FormLabel>
                                    <FormControl>
                                      <MemberCombobox
                                        members={members}
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />

              <FormField
                control={form.control}
                name="month"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Month *"}</FormLabel>
                                    <Select 
                                      onValueChange={v => field.onChange(parseInt(v) || 0)} 
                                      defaultValue={field.value?.toString()}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={"Select Month"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                          <SelectItem key={m} value={m.toString()}>
                                            {(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1])}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Year *"}</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} value={field.value ?? ""} onChange={e => {
                                        const val = parseInt(e.target.value);
                                        field.onChange(isNaN(val) ? "" : val);
                                      }} />
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
                                    <FormLabel>{"Amount *"}</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        field.onChange(isNaN(val) ? "" : val);
                                      }} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Payment Date *"}</FormLabel>
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
                name="paymentMethod"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Payment Method *"}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={"Select method"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="CASH">{"Cash"}</SelectItem>
                                        <SelectItem value="BANK">{"Bank Transfer"}</SelectItem>
                                        <SelectItem value="MOBILE_MONEY">{"Mobile Money (bKash/Nagad)"}</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Reference / Receipt No (Optional)"}</FormLabel>
                                    <FormControl>
                                      <Input placeholder={"e.g. TrxID or Receipt #"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Status *"}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={"Select status"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="PAID">{"Paid"}</SelectItem>
                                        <SelectItem value="PENDING">{"Pending"}</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Remarks / Notes"}</FormLabel>
                                <FormControl>
                                  <Textarea placeholder={"Any additional notes"} className="resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />

            <FormField
              control={form.control}
              name="isAdditional"
              render={({ field }) => {
                return ((
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    {"Additional Payment"}</FormLabel>
                                  <CardDescription>
                                    {"Check this if this is an extra payment, not a regular monthly due"}</CardDescription>
                                </div>
                              </FormItem>
                            ));
              }}
            />

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.push("/contributions")}>
                {"Cancel"}</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Contribution"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
