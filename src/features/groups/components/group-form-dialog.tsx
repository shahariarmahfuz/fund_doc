"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { groupSchema, type GroupFormValues } from "../schema"
import { createGroup, updateGroup } from "../actions"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { Group } from "@/types/models"
import type { GroupWithCount } from "../types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Switch } from "@/components/ui/switch"
import { FormDescription } from "@/components/ui/form"

interface GroupFormDialogProps {
  group?: Group | GroupWithCount
  trigger?: React.ReactNode
}

export function GroupFormDialog({ group, trigger }: GroupFormDialogProps) {
      const [open, setOpen] = useState(false)
  const isEditing = !!group

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema) as Resolver<GroupFormValues>,
    defaultValues: {
      name: group?.name || "",
      code: group?.code || "",
      shortName: group?.shortName || "",
      description: group?.description || "",
      status: (group?.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
      openingBalance: 0,
      remarks: group?.remarks || "",
      memberSignupEnabled: group?.memberSignupEnabled ?? true,
      isFoundationGroup: group?.isFoundationGroup ?? false,
    },
  })

  async function onSubmit(data: GroupFormValues) {
    const res = isEditing
      ? await updateGroup(group.id, data)
      : await createGroup(data)

    if (res.success) {
      toast.success(isEditing ? "Group updated successfully" : "Group created successfully")
      setOpen(false)
      form.reset()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{"Add Group"}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add Group"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Group Name"}</FormLabel>
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
                                <FormLabel>{"Group Code"}</FormLabel>
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
              name="description"
              render={({ field }) => {
                return ((
                              <FormItem>
                                <FormLabel>{"Description"}</FormLabel>
                                <FormControl>
                                  <Input placeholder={"Enter group description..."} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            ));
              }}
            />

            <FormField
              control={form.control}
              name="memberSignupEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5 pr-2">
                    <FormLabel className="text-sm font-semibold">
                    Allow Member Signup
                  </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Enable or disable member registration for this group.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={group?.isFoundationGroup || form.watch("isFoundationGroup")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isEditing && (
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
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                {"Cancel"}</Button>
              <Button type="submit">{"Save Group"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
