"use client"

import { DocumentUploadDialog } from "./document-upload-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, FileText, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentListProps {
  targetType: "MEMBER" | "BENEFICIARY" | "LOAN" | "GRANT" | "FOUNDATION" | "GROUP"
  entityId: string
  documents: any[]
  categories: any[]
}

export function DocumentList({ targetType, entityId, documents, categories }: DocumentListProps) {
      return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{"Related Documents"}</h3>
        <DocumentUploadDialog targetType={targetType} entityId={entityId} categories={categories} />
      </div>

      {documents.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{"No documents have been uploaded"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map(doc => {
            return ((
                      <Card key={doc.id}>
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                          <div className="space-y-1 truncate pr-4">
                            <CardTitle className="text-base truncate" title={doc.title}>{doc.title}</CardTitle>
                            <p className="text-xs text-muted-foreground truncate">{doc.documentNumber}</p>
                          </div>
                          {doc.type === "IMAGE" ? <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" /> : <FileText className="h-5 w-5 text-muted-foreground shrink-0" />}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{doc.category?.name || "No Category"}</Badge>
                            <Badge variant="secondary">{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate" title={doc.description || ""}>
                            {doc.description || "No description provided"}
                          </p>

                          <div className="flex space-x-2 pt-2 border-t mt-2">
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <a href={doc.secureUrl || doc.url} target="_blank" rel="noreferrer">
                                <Eye className="mr-2 h-4 w-4" /> {"see"}</a>
                            </Button>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <a href={doc.secureUrl || doc.url} download={doc.originalFilename}>
                                <Download className="mr-2 h-4 w-4" /> {"Download"}</a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ));
          })}
        </div>
      )}
    </div>
  )
}
