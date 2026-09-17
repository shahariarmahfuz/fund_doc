"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"
import { replaceDocument } from "../replace-action"
import { toast } from "sonner"

interface ReplaceDocumentButtonProps {
  documentId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "icon"
  className?: string
  showLabel?: boolean
}

export function ReplaceDocumentButton({ 
  documentId, 
  variant = "outline", 
  size = "sm",
  className = "",
  showLabel = true
}: ReplaceDocumentButtonProps) {
      const [isReplacing, setIsReplacing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsReplacing(true)
    const formData = new FormData()
    formData.append("file", file)

    const res = await replaceDocument(documentId, formData)
    if (res.success) {
      toast.success("Document replaced successfully")
    } else {
      toast.error(res.error || "Failed to replace document")
    }
    
    setIsReplacing(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <>
      <input 
        type="file" 
        className="hidden" 
        ref={inputRef} 
        onChange={handleFileChange}
        accept=".pdf,image/jpeg,image/png,image/webp,.doc,.docx,.xls,.xlsx,.zip,video/mp4,video/webm"
      />
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={() => inputRef.current?.click()}
        disabled={isReplacing}
        title={"Replace Document"}
      >
        <RefreshCcw className={`h-4 w-4 ${showLabel ? "mr-2" : ""}`} />
        {showLabel ? (isReplacing ? "..." : "Replace") : null}
      </Button>
    </>
  )
}
