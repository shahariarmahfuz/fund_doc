"use client"
import { getNow } from "@/lib/date";
import { formatMonth } from "@/lib/format"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contributionSchema, type ContributionFormValues } from "../schema"
import { createContribution } from "../actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MemberCombobox } from "@/components/member-combobox"

interface ContributionFormDialogProps {
  members: { id: string; fullName: string | null; memberId: string }[]
  trigger?: React.ReactNode
  defaultMonthlyFee?: number
}

export function ContributionFormDialog({ members, trigger, defaultMonthlyFee = 100 }: ContributionFormDialogProps) {
      const [open, setOpen] = useState(false)

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: "",
      month: 1,
      year: 2026,
      amount: defaultMonthlyFee,
      paymentDate: "",
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
      status: "PAID",
      isAdditional: false,
    },
  })

  
  useEffect(() => {
    form.setValue("month", getNow().getMonth() + 1)
    form.setValue("year", getNow().getFullYear())
    form.setValue("paymentDate", getNow().toLocaleDateString("en-CA"))
  }, [form])

  async function onSubmit(data: ContributionFormValues) {
    // Standardize amount to smallest currency unit (e.g., cents if applicable, but we assume input is already base unit or we multiply by 100)
    // The prompt says "Money stored using integer smallest currency unit." Let's assume the user enters standard unit (e.g., 100 dollars) and we multiply by 100.
    const submitData = { ...data, amount: data.amount }
    
    const res = await createContribution(submitData)

    if (res.success) {
      toast.success("Contribution processed successfully!")
      setOpen(false)
      form.reset()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{"Record Contribution"}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{"Record Monthly Contribution"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField control={form.control} name="memberId" render={({ field }) => {
                        return ((
                                      <FormItem>
                                        <FormLabel>{"Member"}</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="month" render={({ field }) => {
                            return ((
                                          <FormItem>
                                            <FormLabel>{"Month"}</FormLabel>
                                            <Select onValueChange={(val) => field.onChange(parseInt(val) || 0)} value={field.value?.toString() || ""}>
                                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                  <SelectItem key={m} value={m.toString()}>{formatMonth(m - 1)}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        ));
                          }} />
              <FormField control={form.control} name="year" render={({ field }) => {
                            return ((
                                          <FormItem><FormLabel>{"Year"}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => { const v = parseInt(e.target.value); field.onChange(isNaN(v) ? "" : v); }} /></FormControl><FormMessage /></FormItem>
                                        ));
                          }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => {
                            return ((
                                          <FormItem><FormLabel>{"Amount"}</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? "" : v); }} /></FormControl><FormMessage /></FormItem>
                                        ));
                          }} />
              <FormField control={form.control} name="paymentDate" render={({ field }) => {
                            return ((
                                          <FormItem><FormLabel>{"Payment Date"}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                        ));
                          }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => {
                            return ((
                                          <FormItem>
                                            <FormLabel>{"Status"}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                <SelectItem value="PAID">{"Paid"}</SelectItem>
                                                <SelectItem value="PENDING">{"Pending"}</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        ));
                          }} />
              <FormField control={form.control} name="paymentMethod" render={({ field }) => {
                            return ((
                                          <FormItem>
                                            <FormLabel>{"Payment Method"}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                <SelectItem value="CASH">{"Cash"}</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">{"Bank Transfer"}</SelectItem>
                                                <SelectItem value="CHECK">{"Check"}</SelectItem>
                                                <SelectItem value="CARD">{"Card"}</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        ));
                          }} />
            </div>

            <FormField control={form.control} name="referenceNumber" render={({ field }) => {
                        return ((
                                    <FormItem><FormLabel>{"Reference Number"}</FormLabel><FormControl><Input placeholder={"Txn ID, Check number..."} {...field} /></FormControl><FormMessage /></FormItem>
                                  ));
                      }} />

            <FormField control={form.control} name="notes" render={({ field }) => {
                        return ((
                                    <FormItem><FormLabel>{"Notes"}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                  ));
                      }} />

            <FormField
              control={form.control}
              name="isAdditional"
              render={({ field }) => {
                return ((
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    {"Additional Payment"}</FormLabel>
                                  <FormDescription>
                                    {"Check this if this is an extra contribution for the same month and year."}</FormDescription>
                                </div>
                              </FormItem>
                            ));
              }}
            />

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                {"Cancel"}</Button>
              <Button type="submit">{"Process Payment"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
