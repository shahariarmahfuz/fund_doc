"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tag, Plus, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { expenseNameSchema, type ExpenseNameFormValues } from "../schema"
import { createExpenseName } from "../actions"

export default function ExpenseNameForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [lastCreatedName, setLastCreatedName] = useState("")

  const form = useForm<ExpenseNameFormValues>({
    resolver: zodResolver(expenseNameSchema) as Resolver<ExpenseNameFormValues>,
    defaultValues: {
      name: "",
      note: "",
    },
  })

  const onSubmit = async (values: ExpenseNameFormValues) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await createExpenseName(values)
      if (res.success && res.data) {
        setLastCreatedName(res.data.name)
        setIsSuccess(true)
        toast.success("Expense name added successfully")
      } else {
        toast.error(res.error || "Failed to add expense name.")
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAnother = () => {
    setIsSuccess(false)
    setLastCreatedName("")
    form.reset({
      name: "",
      note: "",
    })
    setTimeout(() => {
      form.setFocus("name")
    }, 50)
  }

  return (
    <Card className="shadow-sm border-surface-200 bg-white">
      <CardHeader className="border-b border-surface-100 bg-surface-50/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-surface-900">Add Expense Name</CardTitle>
            <CardDescription className="text-surface-500 text-sm mt-0.5">
              Create a new expense name for Foundation expenses.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Success Banner */}
        {isSuccess && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-900 text-sm sm:text-base">
                ✓ Expense name added successfully
              </p>
              {lastCreatedName && (
                <p className="text-xs sm:text-sm text-emerald-700">
                  &ldquo;{lastCreatedName}&rdquo; has been created and is ready to use for expenses.
                </p>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Field 1: Expense Name * */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-surface-700 text-sm">
                    Expense Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Office Rent, Transportation, Utilities"
                      {...field}
                      disabled={isSubmitting || isSuccess}
                      className="h-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field 2: Note (Optional) */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-surface-700 text-sm">
                    Note
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a note about this expense..."
                      rows={4}
                      {...field}
                      disabled={isSubmitting || isSuccess}
                      className="resize-y min-h-[100px] focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-surface-100">
              {isSuccess ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/expenses/names/manage")}
                    className="w-full sm:w-auto border-surface-300 text-surface-700 hover:bg-surface-50"
                  >
                    Manage Expense Names
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddAnother}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/expenses/names/manage")}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto border-surface-300 text-surface-700 hover:bg-surface-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-sm transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Add Expense Name"
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Named exports for compatibility with both import styles
export { ExpenseNameForm, ExpenseNameForm as ExpenseNameManager }
