"use client"
import { getNow } from "@/lib/date";

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Check, ChevronsUpDown, CalendarIcon, CreditCard, BookOpen, FileText, Printer } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { repayLoan } from "../actions"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/format"
import { PrintButton } from "@/components/shared/print-button"

const formSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1"),
  paymentMethod: z.string().min(1, "Select a payment method"),
  referenceNumber: z.string().optional(),
  collectedBy: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.date(),
  receiptUrl: z.string().optional(),
})

interface Loan {
  id: string;
  loanNumber: string;
  remainingBalance: number;
  installmentAmount: number | null;
  nextDueDate: Date | null;
  beneficiary?: {
    fullName: string | null;
    phone: string | null;
    member?: { group?: { name: string } | null } | null;
  } | null;
  loanType: string;
  disbursedDate: Date | null;
  installmentType: string | null;
  amount: number;
  totalPaidAmount: number;
  repayments?: unknown[];
}

export function ReceiveLoanPaymentForm({ loans, initialLoanId }: { loans: Loan[], initialLoanId?: string }) {
      const router = useRouter()
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoanId || "")
  const [openCombobox, setOpenCombobox] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedLoan = useMemo(() => loans.find(l => l.id === selectedLoanId), [selectedLoanId, loans])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "CASH",
      referenceNumber: "",
      collectedBy: "",
      notes: "",
      paymentDate: new Date(),
      receiptUrl: ""
    }
  })

  // Update default amount when loan changes
  useMemo(() => {
    if (selectedLoan) {
      const suggestedAmount = selectedLoan.installmentAmount 
        ? Math.min(selectedLoan.installmentAmount, selectedLoan.remainingBalance)
        : selectedLoan.remainingBalance;
      form.setValue("amount", suggestedAmount)
    }
  }, [selectedLoan, form])

  const daysOverdue = useMemo(() => {
    if (!selectedLoan || !selectedLoan.nextDueDate) return 0;
    const due = new Date(selectedLoan.nextDueDate)
    const today = getNow()
    due.setHours(0,0,0,0)
    today.setHours(0,0,0,0)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }, [selectedLoan])

  
  useEffect(() => {
    form.setValue("paymentDate", new Date())
  }, [form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedLoan) {
      toast.error("Please select a Qard Hasan")
      return
    }

    if (values.amount > selectedLoan.remainingBalance) {
      toast.error(`Amount cannot exceed the remaining balance (৳${selectedLoan.remainingBalance})`)
      return
    }

    setIsSubmitting(true)
    try {
      // Determine installment no
      const currentRepayments = selectedLoan.repayments ? selectedLoan.repayments.length : 0
      const installmentNo = currentRepayments + 1

      const result = await repayLoan(
        selectedLoan.id,
        values.amount,
        values.paymentMethod,
        values.referenceNumber || "",
        installmentNo,
        values.notes,
        values.collectedBy,
        values.paymentDate,
        values.receiptUrl
      )

      if (result.success) {
        toast.success("Repayment recorded successfully")
        router.refresh()
        
        // Reset form for next payment or stay to show updated balance
        const newBalance = selectedLoan.remainingBalance - values.amount
        if (newBalance <= 0) {
          toast.info("Repayment recorded successfully" + " (" + "Completed" + ")")
          setSelectedLoanId("") // clear to select another
        } else {
          // just update the form amount for the next one
          form.setValue("amount", Math.min(selectedLoan.installmentAmount || 0, newBalance))
        }
        
      } else {
        toast.error(result.error)
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickOption = (type: "REGULAR" | "PARTIAL" | "ADVANCE" | "FINAL") => {
    if (!selectedLoan) return;
    let amt = 0;
    const installAmt = selectedLoan.installmentAmount || 0;
    const bal = selectedLoan.remainingBalance;

    if (type === "REGULAR") amt = Math.min(installAmt, bal);
    if (type === "PARTIAL") amt = Math.floor(Math.min(installAmt, bal) / 2);
    if (type === "ADVANCE") amt = Math.min(installAmt * 2, bal);
    if (type === "FINAL") amt = bal;

    form.setValue("amount", amt);
  }

  return (
    <div className="space-y-8">
      {/* Searchable Loan Selector */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{"Select Qard Hasan"}</CardTitle>
          <CardDescription>{"Search by Qard Hasan number or beneficiary"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between h-12 text-base"
              >
                {selectedLoan
                  ? `${selectedLoan.loanNumber} - ${selectedLoan.beneficiary?.fullName} (${selectedLoan.beneficiary?.phone})`
                  : "Search Qard Hasan..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] md:w-[600px] p-0" align="start">
              <Command>
                <CommandInput placeholder={"Search Qard Hasan..."} />
                <CommandList>
                  <CommandEmpty>{"No Qard Hasan found."}</CommandEmpty>
                  <CommandGroup>
                    {loans.map((loan) => {
                      return ((
                                          <CommandItem
                                            key={loan.id}
                                            value={`${loan.loanNumber} ${loan.beneficiary?.fullName} ${loan.beneficiary?.phone}`}
                                            onSelect={() => {
                                              setSelectedLoanId(loan.id)
                                              setOpenCombobox(false)
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedLoanId === loan.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <div className="flex flex-col">
                                              <span className="font-medium">{loan.loanNumber} - {loan.beneficiary?.fullName}</span>
                                              <span className="text-xs text-muted-foreground">{"Mobile" + ": "}{loan.beneficiary?.phone} {"Bal: ৳"}{loan.remainingBalance}</span>
                                            </div>
                                          </CommandItem>
                                        ));
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {selectedLoan && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Summary Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex justify-between items-center">
                  {"Qard Hasan Summary"}<Badge variant={daysOverdue > 0 ? "destructive" : "default"}>
                    {daysOverdue > 0 ? `${daysOverdue} Days Overdue` : "Active"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div className="text-muted-foreground">{"Beneficiary"}</div>
                  <div className="font-medium">{selectedLoan.beneficiary?.fullName}</div>
                  
                  <div className="text-muted-foreground">{"Mobile" + ": "}</div>
                  <div className="font-medium">{selectedLoan.beneficiary?.phone || "-"}</div>
                  
                  <div className="text-muted-foreground">{"Group"}</div>
                  <div className="font-medium">{selectedLoan.beneficiary?.member?.group?.name || "-"}</div>
                  
                  <div className="col-span-2 my-2 border-b"></div>
                  
                  <div className="text-muted-foreground">{"Qard Hasan No"}</div>
                  <div className="font-medium">{selectedLoan.loanNumber}</div>
                  
                  <div className="text-muted-foreground">{"Type"}</div>
                  <div className="font-medium">{selectedLoan.loanType}</div>
                  
                  <div className="text-muted-foreground">{"Disbursement Date"}</div>
                  <div className="font-medium">{selectedLoan.disbursedDate ? formatDate(selectedLoan.disbursedDate) : "-"}</div>
                  
                  <div className="text-muted-foreground">{"Installment Plan"}</div>
                  <div className="font-medium">{selectedLoan.installmentType || "CUSTOM"} {"(৳"}{selectedLoan.installmentAmount || 0})</div>
                  
                  <div className="col-span-2 my-2 border-b"></div>
                  
                  <div className="text-muted-foreground">{"Amount"}</div>
                  <div className="font-medium text-base">৳{formatCurrency(selectedLoan.amount)}</div>
                  
                  <div className="text-muted-foreground">{"Total Paid"}</div>
                  <div className="font-medium text-green-600">৳{formatCurrency(selectedLoan.totalPaidAmount)}</div>
                  
                  <div className="text-muted-foreground">{"Remaining Balance"}</div>
                  <div className="font-bold text-lg text-red-600">৳{formatCurrency(selectedLoan.remainingBalance)}</div>
                  
                  <div className="text-muted-foreground">{"First Installment Date"}</div>
                  <div className="font-medium">{selectedLoan.nextDueDate ? formatDate(selectedLoan.nextDueDate) : "-"}</div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4 border-t flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/loans/${selectedLoan.id}`}><BookOpen className="w-4 h-4 mr-2" /> {"View Details"}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/loans/ledger?loanId=${selectedLoan.id}`}><FileText className="w-4 h-4 mr-2" /> {"View Ledger"}</Link>
                </Button>
                <PrintButton className="w-full" />
              </CardFooter>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-7">
            <Card className="border-primary/20 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {"Receive Repayment"}</CardTitle>
                <CardDescription>{"Enter repayment details"}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <div className="bg-muted/40 p-4 rounded-lg mb-6 flex flex-wrap gap-2 justify-center">
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleQuickOption("REGULAR")}>
                        {"Regular"}</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleQuickOption("PARTIAL")}>
                        {"Partial"}</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleQuickOption("ADVANCE")}>
                        {"Advance"}</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleQuickOption("FINAL")}>
                        {"Final"}</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => {
                          return ((
                                                  <FormItem>
                                                    <FormLabel className="text-base">{"Payment Amount"}</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        type="number" 
                                                        className="h-12 text-lg font-bold" 
                                                        {...field} 
                                                        onChange={e => field.onChange(e.target.valueAsNumber || 0)} 
                                                      />
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
                                                  <FormItem className="flex flex-col justify-end">
                                                    <FormLabel className="text-base mb-1.5">{"Payment Date"}</FormLabel>
                                                    <Popover>
                                                      <PopoverTrigger asChild>
                                                        <FormControl>
                                                          <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                              "w-full h-12 pl-3 text-left font-normal",
                                                              !field.value && "text-muted-foreground"
                                                            )}
                                                          >
                                                            {field.value ? (
                                                              format(field.value, "PPP")
                                                            ) : (
                                                              <span>{"Pick a date"}</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                          </Button>
                                                        </FormControl>
                                                      </PopoverTrigger>
                                                      <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                          mode="single"
                                                          selected={field.value}
                                                          onSelect={field.onChange}
                                                        />
                                                      </PopoverContent>
                                                    </Popover>
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
                                                    <FormLabel>{"Payment Method"}</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                      <FormControl>
                                                        <SelectTrigger className="h-11">
                                                          <SelectValue placeholder={"Select Method"} />
                                                        </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent>
                                                        <SelectItem value="CASH">{"Cash"}</SelectItem>
                                                        <SelectItem value="BANK">{"Bank Transfer"}</SelectItem>
                                                        <SelectItem value="MOBILE">{"Mobile Banking"}</SelectItem>
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
                                                    <FormLabel>{"Receipt Number"}</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder={"Enter receipt number"} className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                ));
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="collectedBy"
                        render={({ field }) => {
                          return ((
                                                  <FormItem>
                                                    <FormLabel>{"Collector Name (Optional)"}</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder={"Enter name"} className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                ));
                        }}
                      />
                      
                      <FormField
                        control={form.control}
                        name="receiptUrl"
                        render={({ field }) => {
                          return ((
                                                  <FormItem>
                                                    <FormLabel>{"Receipt Upload URL (Optional)"}</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder="https://..." className="h-11" {...field} />
                                                    </FormControl>
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
                                                <FormLabel>{"Remarks"}</FormLabel>
                                                <FormControl>
                                                  <Textarea placeholder={"Enter comment..."} className="resize-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            ));
                      }}
                    />

                    {/* Calculation Summary */}
                    {form.watch("amount") > 0 && (
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mt-4">
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span>{"Projected Remaining Balance"}</span>
                          <span className={cn(
                            "text-lg",
                            selectedLoan.remainingBalance - form.watch("amount") <= 0 ? "text-green-600" : "text-primary"
                          )}>
                            ৳{formatCurrency(Math.max(0, selectedLoan.remainingBalance - form.watch("amount")))}
                            {selectedLoan.remainingBalance - form.watch("amount") <= 0 && " (" + "Completed" + ")"}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Record Repayment"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
