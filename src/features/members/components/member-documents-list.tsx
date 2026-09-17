"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, Film, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReplaceDocumentButton } from "@/features/documents/components/replace-document-button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface MemberDocumentsListProps {
  documents: any[]
}

const getFileIcon = (mimeType: string) => {
  if (!mimeType) return <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
  if (mimeType === 'application/pdf') return <FileText className="h-10 w-10 text-red-500 mb-2" />
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-10 w-10 text-green-500 mb-2" />
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-10 w-10 text-blue-500 mb-2" />
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return <FileArchive className="h-10 w-10 text-yellow-600 mb-2" />
  if (mimeType.startsWith('video/')) return <Film className="h-10 w-10 text-purple-500 mb-2" />
  return <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
}

const REQUIRED_DOCS = [
  "Member Photo",
  "National ID Front",
  "National ID Back",
  "Birth Certificate",
  "Signature Image"
]

export function MemberDocumentsList({ documents }: MemberDocumentsListProps) {
      // Only show the specific slots
  const docsByTitle = documents.reduce((acc, doc) => {
    acc[doc.title] = doc
    return acc
  }, {} as Record<string, any>)

  const slotsToRender = REQUIRED_DOCS.filter(title => {
    // Only show NID or Birth Cert if they exist
    if (!docsByTitle[title]) {
      // If we don't have it, let's see if we should show a placeholder or just omit it.
      // The requirement says: "display the documents already uploaded during Member creation... Each document should support... No generic Upload button."
      // It makes sense to only render the ones that actually exist for this member.
      return false;
    }
    return true;
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{"Member Documents"}</h3>
      </div>

      {slotsToRender.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{"No documents uploaded."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slotsToRender.map(title => {
            const doc = docsByTitle[title]
            const isImage = doc.type === "IMAGE" || doc.mimeType?.startsWith('image/')
            return (
              <Card key={doc.id} className="overflow-hidden flex flex-col">
                <div className="bg-muted/30 border-b flex items-center justify-center h-40 relative group">
                  {isImage && doc.secureUrl ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-full h-full relative cursor-pointer hover:opacity-90 transition-opacity">
                          <img 
                            src={doc.secureUrl} 
                            alt={doc.title} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="text-white h-8 w-8" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-full p-1 bg-transparent border-none shadow-none">
                        <img 
                          src={doc.secureUrl} 
                          alt={doc.title} 
                          className="w-full h-auto max-h-[85vh] object-contain rounded-md"
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4">
                      {getFileIcon(doc.mimeType)}
                      <span className="text-xs text-muted-foreground truncate w-full px-2" title={doc.originalFilename}>
                        {doc.originalFilename}
                      </span>
                    </div>
                  )}
                </div>

                <CardHeader className="py-3 px-4 flex flex-row items-start justify-between">
                  <div className="space-y-1 truncate pr-2">
                    <CardTitle className="text-base truncate" title={doc.title}>{doc.title}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{doc.documentNumber}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="px-4 pb-4 space-y-3 flex-1 flex flex-col justify-end">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{doc.category?.name || "Uncategorized"}</Badge>
                    <Badge variant="secondary">{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                  
                  {doc.description && (
                    <p className="text-xs text-muted-foreground truncate" title={doc.description}>
                      {doc.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-auto">
                    {!isImage && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={doc.secureUrl} target="_blank" rel="noreferrer">
                          <Eye className="mr-2 h-4 w-4" /> {"View"}</a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={doc.secureUrl} download={doc.originalFilename}>
                        <Download className="mr-2 h-4 w-4" /> {"Save"}</a>
                    </Button>
                    <ReplaceDocumentButton documentId={doc.id} className="w-full col-span-2" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
