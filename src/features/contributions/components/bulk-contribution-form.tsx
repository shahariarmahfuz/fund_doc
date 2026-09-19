"use client"
import { getNow } from "@/lib/date";
import { useState, useEffect, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { createBulkContribution, getMemberPaidMonths } from "../actions"
import { bulkContributionSchema, type BulkContributionFormValues } from "../schema"
import { MemberCombobox } from "@/components/member-combobox"

import { InfoIcon, CheckCircle2, AlertTriangle } from "lucide-react"

export function BulkContributionForm({
  members,
  defaultMonthlyFee = 100,
}: {
  members: { id: string; memberId: string; fullName: string | null; group: { name: string; code: string } | null }[]
  defaultMonthlyFee?: number
}) {
        const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [paidMonths, setPaidMonths] = useState<Set<string>>(new Set());
    const [paymentMode, setPaymentMode] = useState<"SINGLE" | "MULTIPLE">("SINGLE");

    const defaultValues: Partial<BulkContributionFormValues> = {
      memberId: "",
      fromMonth: getNow().getMonth() + 1,
      fromYear: getNow().getFullYear(),
      toMonth: getNow().getMonth() + 1,
      toYear: getNow().getFullYear(),
      monthlyAmount: defaultMonthlyFee,
      paymentDate: "",
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    }

    const form = useForm<BulkContributionFormValues>({
      resolver: zodResolver(bulkContributionSchema),
      defaultValues,
    })

    const memberId = form.watch("memberId");
    const fromMonth = form.watch("fromMonth");
    const fromYear = form.watch("fromYear");
    const toMonth = form.watch("toMonth");
    const toYear = form.watch("toYear");
    const monthlyAmount = form.watch("monthlyAmount");

    useEffect(() => {
      form.setValue("paymentDate", getNow().toLocaleDateString("en-CA"))
    }, [form])

    useEffect(() => {
      async function fetchPaid() {
        if (!memberId) {
          setPaidMonths(new Set());
          return;
        }
        const paid = await getMemberPaidMonths(memberId);
        setPaidMonths(new Set(paid));
      }
      fetchPaid();
    }, [memberId]);

    // Derived State
    const calculation = useMemo(() => {
      const targetMonths: { month: number, year: number, key: string, isPaid: boolean }[] = [];
      let curMonth = fromMonth;
      let curYear = fromYear;
      const endMonth = toMonth;
      const endYear = toYear;

      if (!fromMonth || !fromYear || !toMonth || !toYear) {
         return { totalMonths: 0, targetMonths: [], alreadyPaid: [], newRecords: [] };
      }

      if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
        return { totalMonths: 0, targetMonths: [], alreadyPaid: [], newRecords: [] };
      }

      while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
        const key = `${curMonth}-${curYear}`;
        targetMonths.push({ month: curMonth, year: curYear, key, isPaid: paidMonths.has(key) });
        curMonth++;
        if (curMonth > 12) {
          curMonth = 1;
          curYear++;
        }
      }

      const alreadyPaid = targetMonths.filter(m => m.isPaid);
      const newRecords = targetMonths.filter(m => !m.isPaid);

      return {
        totalMonths: targetMonths.length,
        targetMonths,
        alreadyPaid,
        newRecords
      }
    }, [fromMonth, fromYear, toMonth, toYear, paidMonths]);

    useEffect(() => {
      if (paymentMode === "SINGLE") {
        form.setValue("toMonth", fromMonth);
        form.setValue("toYear", fromYear);
      }
    }, [paymentMode, fromMonth, fromYear, form]);

    async function onSubmit(data: BulkContributionFormValues) {
      if (calculation.newRecords.length === 0) {
        toast.error("No new records to create. All selected months are already paid.");
        return;
      }
      setLoading(true)
      const res = await createBulkContribution(data)
      if (res.success) {
        const count = 'count' in res && typeof res.count === 'number' ? res.count : calculation.newRecords.length;
        toast.success(`Successfully recorded contribution for ${count} month(s).`);

        // Refresh paid months for the current member so the UI updates immediately
        if (memberId) {
          const paid = await getMemberPaidMonths(memberId);
          setPaidMonths(new Set(paid));
        }
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save contribution")
      }
      setLoading(false)
    }

    const selectedMember = members.find(m => m.id === memberId);

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Card className="shadow-sm border-muted">
          <CardHeader className="py-4 border-b bg-muted/10">
            <CardTitle className="text-lg font-semibold">{"Monthly Dues Payment"}</CardTitle>
            <CardDescription>{"Process dues for a single month or multiple months at once."}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem className="md:w-1/2">
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
                  )}
                />

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 pb-2">
                    <label className="text-sm font-medium leading-none">{"Payment Mode"}</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="paymentMode" 
                          value="SINGLE" 
                          checked={paymentMode === "SINGLE"}
                          onChange={() => setPaymentMode("SINGLE")}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">{"Single Month"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="paymentMode" 
                          value="MULTIPLE" 
                          checked={paymentMode === "MULTIPLE"}
                          onChange={() => setPaymentMode("MULTIPLE")}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">{"Multiple Months"}</span>
                      </label>
                    </div>
                  </div>
                  
                  {paymentMode === "SINGLE" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fromMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{"Month"}</FormLabel>
                            <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fromYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{"Year"}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || "")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="fromMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{"From Month"}</FormLabel>
                            <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fromYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{"From Year"}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || "")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="toMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{"To Month"}</FormLabel>
                            <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="toYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{"To Year"}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || "")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {paymentMode === "MULTIPLE" ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-muted/20 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="monthlyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{"Monthly Amount"}</FormLabel>
                          <FormControl>
                            <Input type="number" readOnly className="bg-muted/50 cursor-not-allowed" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value) || "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-1">{"Total Months"}</span>
                      <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-semibold">
                        {calculation.totalMonths}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 md:col-span-2">
                      <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-1">{"Total Amount"}</span>
                      <div className="h-10 px-3 py-2 border rounded-md bg-primary/10 text-primary flex items-center text-lg font-bold">
                        ৳ {calculation.totalMonths * (monthlyAmount || 0)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="monthlyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{"Amount"}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value) || "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {memberId && calculation.totalMonths > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">{"Payment Preview"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {calculation.alreadyPaid.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-md p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 stroke-orange-800 mt-0.5" />
                            <div>
                              <h4 className="font-semibold">{"Already Paid"}</h4>
                              <p className="text-sm mt-1">{"These months are already paid and will be skipped:"}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {calculation.alreadyPaid.map(m => (
                                  <Badge key={m.key} variant="outline" className="bg-orange-100 border-orange-300 hover:bg-orange-200">
                                    {m.month}/{m.year}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {calculation.newRecords.length > 0 ? (
                        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 stroke-green-800 mt-0.5" />
                            <div className="w-full">
                              <h4 className="font-semibold">{"New Records To Be Created"}</h4>
                              <p className="text-sm mt-1">{"Payments will be recorded for:"}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {calculation.newRecords.map(m => (
                                  <Badge key={m.key} variant="outline" className="bg-green-100 border-green-300 hover:bg-green-200 text-green-800">
                                    {m.month}/{m.year}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-4 font-bold text-lg">
                                {"Actual Charge:"} ৳ {calculation.newRecords.length * (monthlyAmount || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 stroke-red-800 mt-0.5" />
                            <div>
                              <h4 className="font-semibold">{"No Action Required"}</h4>
                              <p className="text-sm mt-1">{"All selected months have already been paid."}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"Payment Date *"}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
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
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"Reference / Receipt No (Optional)"}</FormLabel>
                        <FormControl>
                          <Input placeholder={"e.g. TrxID or Receipt #"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{"Remarks / Notes"}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={"Any additional notes"} className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => router.push("/contributions")}>
                    {"Cancel"}
                  </Button>
                  <Button type="submit" disabled={loading || calculation.newRecords.length === 0}>
                    {loading ? "Saving..." : "Save Contribution"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
}
