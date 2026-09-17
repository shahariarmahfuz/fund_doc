"use client"

import { Button, ButtonProps } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton({ className, ...props }: ButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => {
        return window.print()
      }} 
      className={className} 
      {...props}
    >
      <Printer className="w-4 h-4 mr-2" />
      Print
    </Button>
  )
}
