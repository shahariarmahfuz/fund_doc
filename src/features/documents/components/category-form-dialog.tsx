"use client"

import { useState } from "react"
import { createDocumentCategory } from "../actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function CategoryFormDialog({ trigger }: { trigger?: React.ReactNode }) {
      const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) return toast.error("Category name is required")

    try {
      const res = await createDocumentCategory(name, description)
      if (res.success) {
        toast.success("Category created successfully")
        setOpen(false)
        setName("")
        setDescription("")
      } else {
        toast.error((res as any).error)
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="mr-2 h-4 w-4" /> {"New Category"}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{"Create Document Category"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>{"Category Name *"}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>{"Description"}</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>{"Cancel"}</Button>
            <Button type="submit">{"Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
