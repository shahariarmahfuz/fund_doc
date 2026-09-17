"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Receipt,
  Building2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  PlusCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { expenseSchema, type ExpenseFormValues } from "../schema"
import { createExpense, updateExpense, getGroupBalance } from "../actions"
import { formatDateInput, getNow } from "@/lib/date"
import type { ExpenseName, Expense, Group } from "@/types/models"
import Link from "next/link"

interface ExpenseFormProps {
  expenseNames: ExpenseName[]
  groups: Group[]
  initialExpense?: Expense | null
  isEdit?: boolean
}

export function ExpenseForm({ expenseNames, groups, initialExpense, isEdit = false }: ExpenseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupBalance, setGroupBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Determine initial name mode
  const initialMode = initialExpense?.expenseNameId
    ? "existing"
    : (initialExpense?.customName
      ? "custom"
      : (expenseNames.length > 0 ? "existing" : "custom"))

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema as any),
    defaultValues: {
      groupId: initialExpense?.groupId || (groups.length === 1 ? groups[0].id : ""),
      nameMode: initialMode,
      expenseNameId: initialExpense?.expenseNameId || "",
      customName: initialExpense?.customName || "",
      amount: initialExpense ? Number(initialExpense.amount) : ("" as any),
      comment: initialExpense?.comment || "",
      expenseDate: initialExpense
        ? formatDateInput(initialExpense.expenseDate)
        : formatDateInput(getNow()),
    },
  })

  const currentMode = form.watch("nameMode")
  const selectedGroupId = form.watch("groupId")
  const enteredAmount = form.watch("amount")

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupBalance(null)
      return
    }

    let isCancelled = false
    setIsLoadingBalance(true)
    getGroupBalance(selectedGroupId)
      .then(res => {
        if (!isCancelled && res.success && res.data) {
          setGroupBalance(res.data.currentBalance ?? 0)
        }
      })
      .catch(err => {
        console.error("Failed to fetch group balance", err)
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingBalance(false)
      })

    return () => {
      isCancelled = true
    }
  }, [selectedGroupId])

  // In edit mode, if editing the same group, the original expense amount was already deducted,
  // so the effective headroom is currentBalance + original amount
  const effectiveAvailableBalance =
    groupBalance !== null
      ? (isEdit && initialExpense?.groupId === selectedGroupId
          ? groupBalance + Number(initialExpense.amount || 0)
          : groupBalance)
      : null

  const isOverBalance =
    effectiveAvailableBalance !== null &&
    enteredAmount !== undefined &&
    enteredAmount !== ("" as any) &&
    Number(enteredAmount) > effectiveAvailableBalance

  const onSubmit = async (values: ExpenseFormValues) => {
    if (isOverBalance) {
      toast.error(
        `Insufficient group balance. Selected group only has ৳${effectiveAvailableBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available.`
      )
      return
    }

    setIsSubmitting(true)
    try {
      if (isEdit && initialExpense) {
        const res = await updateExpense(initialExpense.id, values)
        if (res.success) {
          toast.success("Expense record updated successfully!")
          router.push("/expenses/manage")
          router.refresh()
        } else {
          toast.error(res.error || "Failed to update expense.")
        }
      } else {
        const res = await createExpense(values)
        if (res.success) {
          toast.success("Expense recorded successfully!")
          router.push("/expenses/manage")
          router.refresh()
        } else {
          toast.error(res.error || "Failed to record expense.")
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/expenses/manage">
          <Button variant="ghost" size="sm" className="gap-2 text-surface-600 hover:text-surface-900 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Manage Expenses
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm border-surface-200">
        <CardHeader className="border-b bg-surface-50/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-surface-900">
                {isEdit ? "Edit Expense" : "Record New Expense"}
              </CardTitle>
              <CardDescription>
                {isEdit
                  ? "Update expense details, amount, or date."
                  : "Record money spent by the Foundation for operations, events, or maintenance."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Group / Funding Source Selection */}
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-semibold text-surface-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-primary-600" />
                        Group (Funding Source) <span className="text-red-500">*</span>
                      </span>
                      {selectedGroupId && (
                        <span className="text-xs font-normal text-surface-500">
                          Money will be deducted from this group
                        </span>
                      )}
                    </FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-white text-left">
                          <SelectValue placeholder="Select Group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            <span className="font-medium">{group.name}</span>{" "}
                            <span className="text-surface-400 text-xs">({group.code})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />

                    {/* Available Balance Box */}
                    {selectedGroupId && (
                      <div
                        className={cn(
                          "mt-2 p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm",
                          isOverBalance
                            ? "bg-red-50/80 border-red-200"
                            : "bg-surface-50/80 border-surface-200"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-surface-600 text-xs sm:text-sm">Available Balance:</span>
                          {isLoadingBalance ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-surface-400" />
                          ) : (
                            <span
                              className={cn(
                                "font-bold text-base",
                                isOverBalance
                                  ? "text-red-700"
                                  : (effectiveAvailableBalance !== null && effectiveAvailableBalance > 0
                                      ? "text-emerald-700"
                                      : "text-amber-700")
                              )}
                            >
                              ৳
                              {effectiveAvailableBalance !== null
                                ? effectiveAvailableBalance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "0.00"}
                            </span>
                          )}
                        </div>

                        {isOverBalance && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100/90 px-2.5 py-1 rounded">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Amount exceeds available balance</span>
                          </div>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Expense Name Selection Mode */}
              <div className="space-y-3 bg-surface-50/50 p-4 rounded-lg border border-surface-200">
                <label className="text-sm font-semibold text-surface-900">
                  Expense Type / Name <span className="text-red-500">*</span>
                </label>

                <FormField
                  control={form.control}
                  name="nameMode"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={val => {
                        field.onChange(val)
                        if (val === "existing") {
                          form.setValue("customName", "")
                        } else {
                          form.setValue("expenseNameId", "")
                        }
                      }}
                      className="flex flex-col sm:flex-row gap-4 pt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="mode-existing" />
                        <Label htmlFor="mode-existing" className="font-medium text-surface-700 cursor-pointer">
                          Select existing Expense Name
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="mode-custom" />
                        <Label htmlFor="mode-custom" className="font-medium text-surface-700 cursor-pointer">
                          Enter custom / one-off name
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />

                {currentMode === "existing" ? (
                  <div className="pt-2">
                    <FormField
                      control={form.control}
                      name="expenseNameId"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Select Expense Name" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseNames.filter(n => n.isActive).map(name => (
                                <SelectItem key={name.id} value={name.id}>
                                  {name.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs text-surface-500 flex items-center justify-between">
                            <span>Choose an existing expense name.</span>
                            <Link
                              href="/expenses/names"
                              className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                            >
                              <PlusCircle className="w-3 h-3" />
                              Add Expense Name
                            </Link>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="pt-2">
                    <FormField
                      control={form.control}
                      name="customName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="e.g. Emergency Generator Repair, Conference Catering"
                              className="bg-white"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-surface-500">
                            Use this for unique or one-time expenses without saving as a reusable expense name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Amount and Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-surface-700">
                        Amount (BDT ৳) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 font-medium">
                            ৳
                          </span>
                          <Input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder="0.00"
                            className={cn("pl-8 text-base font-medium", isOverBalance && "border-red-500 focus-visible:ring-red-500")}
                            value={field.value ?? ""}
                            onChange={e => {
                              const val = e.target.value === "" ? "" : Number(e.target.value)
                              field.onChange(val)
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      {isOverBalance && (
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Amount exceeds group&apos;s available balance (৳{effectiveAvailableBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expense Date */}
                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-surface-700">
                        Expense Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Comment / Notes */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-surface-700">
                      Comment / Description <span className="text-surface-400 font-normal">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details regarding this expense (voucher no, purpose, payee, etc.)"
                        rows={3}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
                <Link href="/expenses/manage">
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px]"
                  disabled={isSubmitting || !!isOverBalance}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isEdit ? (
                    "Update Expense"
                  ) : (
                    "Add Expense"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
