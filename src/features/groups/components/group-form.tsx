"use client"

import { useState, useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { groupSchema, type GroupFormValues } from "../schema"
import { createGroup } from "../actions"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { Switch } from "@/components/ui/switch"
import { FormDescription } from "@/components/ui/form"

export function GroupForm() {
      const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema) as Resolver<GroupFormValues>,
    defaultValues: {
      name: "",
      code: "",
      shortName: "",
      description: "",
      status: "ACTIVE",
      openingBalance: 0,
      remarks: "",
      memberSignupEnabled: true,
      isFoundationGroup: false,
    },
  })

  useEffect(() => {
    // Safely auto-generate code on mount
    form.setValue("code", "G-" + Math.floor(1000 + Math.random() * 9000))
  }, [form])

  async function onSubmit(data: GroupFormValues) {
    setIsSubmitting(true)
    const res = await createGroup(data)
    setIsSubmitting(false)

    if (res.success) {
      toast.success("Group created successfully")
      router.push("/groups/manage")
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Group Information"}</CardTitle>
        <CardDescription>{"Create a new group in the organization."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{"Basic Information"}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => {
                    return ((
                                      <FormItem>
                                        <FormLabel>{"Group Name"}<span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                          <Input placeholder={"Enter group name"} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    ));
                  }}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => {
                    return ((
                                      <FormItem>
                                        <FormLabel>{"Group Code"}<span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                          <Input placeholder={"G-001"} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    ));
                  }}
                />
                <FormField
                  control={form.control}
                  name="shortName"
                  render={({ field }) => {
                    return ((
                                      <FormItem>
                                        <FormLabel>{"Short Name"}</FormLabel>
                                        <FormControl>
                                          <Input placeholder={""} {...field} />
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
                                        <FormLabel>{"Status"}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder={"Select Status"} />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="ACTIVE">{"Active"}</SelectItem>
                                            <SelectItem value="INACTIVE">{"Inactive"}</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    ));
                  }}
                />

                <FormField
                  control={form.control}
                  name="memberSignupEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-1 md:col-span-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">
                          Allow Member Signup
                        </FormLabel>
                        <FormDescription className="text-xs text-muted-foreground">
                          If turned OFF, this group will be hidden from public and admin registration forms.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.watch("isFoundationGroup")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Description"}</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder={"Enter group description..."} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">{"Financial Information"}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="openingBalance"
                  render={({ field }) => {
                    return ((
                                      <FormItem>
                                        <FormLabel>{"Current Fund"}</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="0" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    ));
                  }}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">{"Additional Information"}</h3>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => {
                  return ((
                                  <FormItem>
                                    <FormLabel>{"Remarks"}</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder={"Enter remarks..."} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ));
                }}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button variant="outline" type="button" onClick={() => router.push("/groups/manage")}>
                {"Cancel"}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Group"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
