"use client"
import { getNow } from "@/lib/date";

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contributionSchema, type ContributionFormValues } from "../schema"
import { updateContribution } from "../actions"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface EditContributionSheetProps {
  isOpen: boolean
  onClose: () => void
  contribution: any
}

export function EditContributionSheet({ isOpen, onClose, contribution }: EditContributionSheetProps) {
      const [isSubmitting, setIsSubmitting] = useState(false)

  const payment = contribution.payments?.[0] || null

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: contribution.memberId,
      month: contribution.month,
      year: contribution.year,
      amount: payment ? payment.amount : contribution.expectedAmount,
      paymentDate: payment ? new Date(payment.paymentDate).toISOString().split('T')[0] : "",
      paymentMethod: payment ? payment.paymentMethod : "CASH",
      referenceNumber: payment?.referenceNumber || "",
      notes: payment?.notes || "",
      status: contribution.status,
      isAdditional: contribution.isAdditional,
    },
  })

  useEffect(() => {
    if (!payment) {
      form.setValue("paymentDate", getNow().toLocaleDateString('en-CA'))
    }
  }, [form, payment])

  async function onSubmit(data: ContributionFormValues) {
    setIsSubmitting(true)
    const result = await updateContribution(contribution.id, data)
    setIsSubmitting(false)

    if (result.success) {
      toast.success("Contribution updated successfully")
      onClose()
    } else {
      toast.error(result.error || "Failed to save contribution")
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{"Edit Contribution"}</SheetTitle>
          <SheetDescription>
            {"Update contribution and payment details"}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
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
                                    {["PENDING", "PAID", "CANCELLED"].map((status) => (
                                      <SelectItem key={status === "PAID" ? "Paid" : status === "PENDING" ? "Pending" : "Cancelled"} value={status === "PAID" ? "Paid" : status === "PENDING" ? "Pending" : "Cancelled"}>
                                        {status === "PAID" ? "Paid" : status === "PENDING" ? "Pending" : "Cancelled"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Amount *"}</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => { const v = parseInt(e.target.value); field.onChange(isNaN(v) ? "" : v); }} />
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
            </div>

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
                                    <SelectItem value="BKASH">{"bKash"}</SelectItem>
                                    <SelectItem value="NAGAD">{"Nagad"}</SelectItem>
                                    <SelectItem value="BANK">{"Bank Transfer"}</SelectItem>
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
                                  <Input {...field} placeholder={"e.g. TrxID or Receipt #"} />
                                </FormControl>
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
                              <FormItem>
                                <FormLabel>{"Remarks / Notes"}</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder={"Any additional notes"} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />

            <div className="pt-4 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {"Cancel"}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Contribution"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
