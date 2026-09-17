"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { saveSystemSettings } from "@/features/settings/actions";
import { Loader2, Image as ImageIcon, Trash2 } from "lucide-react";

interface FoundationBrandingFormProps {
  initialSettings: Record<string, string>;
}

export function FoundationBrandingForm({ initialSettings }: FoundationBrandingFormProps) {
      const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    BRANDING_FOUNDATION_NAME: initialSettings.BRANDING_FOUNDATION_NAME || "",
    BRANDING_SHORT_NAME: initialSettings.BRANDING_SHORT_NAME || "",
    BRANDING_LOGO: initialSettings.BRANDING_LOGO || "",
    BRANDING_FAVICON: initialSettings.BRANDING_FAVICON || "",
    BRANDING_LOGIN_LOGO: initialSettings.BRANDING_LOGIN_LOGO || "",
    BRANDING_SIDEBAR_LOGO: initialSettings.BRANDING_SIDEBAR_LOGO || "",
    BRANDING_HEADER_LOGO: initialSettings.BRANDING_HEADER_LOGO || "",
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof formData) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const validTypes = fieldName.includes('FAVICON') 
      ? ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg', 'image/webp']
      : ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      
    if (!validTypes.includes(file.type)) {
       toast.error("Invalid file type. Supported: PNG, JPG, WEBP" + (fieldName.includes('FAVICON') ? ", ICO" : ", SVG"));
       setUploadingField(null);
       return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
       toast.error("File size must be less than 2MB");
       setUploadingField(null);
       return;
    }
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "branding");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (result.secure_url) {
        setFormData((prev) => ({ ...prev, [fieldName]: result.secure_url }));
        toast.success(`Image uploaded for ${fieldName.split('_').slice(1).join(' ').toLowerCase()}.`);
      } else {
        throw new Error(result.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const updatedData = { ...formData };
      
      // Append cache-busting timestamp
      Object.keys(updatedData).forEach(key => {
        if (key.includes('LOGO') || key.includes('FAVICON')) {
           const val = (updatedData as any)[key];
           if (val) {
               const cleanUrl = val.split('?')[0];
               (updatedData as any)[key] = `${cleanUrl}?v=${timestamp}`;
           }
        }
      });

      await saveSystemSettings(updatedData, "Branding");
      toast.success("Foundation branding updated successfully");
      
      // Forcefully update the main favicon dynamically so the browser tab reacts instantly
      if (updatedData.BRANDING_FAVICON) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = updatedData.BRANDING_FAVICON;
      }
      
      setTimeout(() => window.location.reload(), 1000); // Reload to fetch fresh layout metadata
    } catch (error) {
      toast.error("Failed to update branding settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Foundation Branding"}</CardTitle>
        <CardDescription>
          {"Customize the visual identity of your foundation across the application."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="BRANDING_FOUNDATION_NAME">{"Foundation Name"}</Label>
              <Input
                id="BRANDING_FOUNDATION_NAME"
                value={formData.BRANDING_FOUNDATION_NAME}
                onChange={(e) => setFormData({ ...formData, BRANDING_FOUNDATION_NAME: e.target.value })}
                placeholder={"e.g. Acme Foundation"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="BRANDING_SHORT_NAME">{"Short Name"}</Label>
              <Input
                id="BRANDING_SHORT_NAME"
                value={formData.BRANDING_SHORT_NAME}
                onChange={(e) => setFormData({ ...formData, BRANDING_SHORT_NAME: e.target.value })}
                placeholder={"e.g. Acme"}
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-lg font-medium">{"Logos & Assets"}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              <ImageUploadField 
                id="BRANDING_LOGO" 
                label={"Primary Logo"} 
                description={"Used in main navigation and default displays."} 
                formData={formData}
                uploadingField={uploadingField}
                handleFileChange={handleFileChange}
                setFormData={setFormData}
              />
              <ImageUploadField 
                id="BRANDING_FAVICON" 
                label={"Favicon"} 
                description={"Small icon shown in the browser tab (ideally 32x32px or 64x64px)."} 
                formData={formData}
                uploadingField={uploadingField}
                handleFileChange={handleFileChange}
                setFormData={setFormData}
              />
              <ImageUploadField 
                id="BRANDING_LOGIN_LOGO" 
                label={"Login Page Logo"} 
                description={"Prominent logo displayed on the authentication screens."} 
                formData={formData}
                uploadingField={uploadingField}
                handleFileChange={handleFileChange}
                setFormData={setFormData}
              />
              <ImageUploadField 
                id="BRANDING_SIDEBAR_LOGO" 
                label={"Sidebar Logo"} 
                description={"Logo shown at the top of the application sidebar."} 
                formData={formData}
                uploadingField={uploadingField}
                handleFileChange={handleFileChange}
                setFormData={setFormData}
              />
              <ImageUploadField 
                id="BRANDING_HEADER_LOGO" 
                label={"Header Logo"} 
                description={"Logo shown in the top header or mobile view."} 
                formData={formData}
                uploadingField={uploadingField}
                handleFileChange={handleFileChange}
                setFormData={setFormData}
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button type="submit" disabled={isSubmitting || uploadingField !== null}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {"Save Branding Options"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ImageUploadField({ 
  id, 
  label, 
  description,
  formData,
  uploadingField,
  handleFileChange,
  setFormData
}: { 
  id: any, 
  label: string, 
  description: string,
  formData: any,
  uploadingField: string | null,
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => Promise<void>,
  setFormData: React.Dispatch<React.SetStateAction<any>>
}) {
    return (
    <div className="flex flex-col space-y-3">
      <Label htmlFor={id} className="text-base font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      
      <div className="flex items-center gap-4 mt-2">
        <div className="relative h-20 w-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden group">
          {formData[id] ? (
            <img src={formData[id]} alt={label} className="h-full w-full object-contain p-2" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          )}
          {uploadingField === id && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex gap-2">
          <Input
            id={id}
            type="file"
            accept={id.includes('FAVICON') ? ".png,.jpg,.jpeg,.webp,.ico" : ".png,.jpg,.jpeg,.webp,.svg"}
            onChange={(e) => handleFileChange(e, id)}
            disabled={uploadingField !== null}
            className="cursor-pointer"
          />
          {formData[id] && (
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={() => setFormData((prev: any) => ({ ...prev, [id]: "" }))}
              title={"Delete Logo"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
