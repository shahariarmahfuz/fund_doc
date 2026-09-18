"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { saveUserProfile } from "@/features/settings/actions";
import { useSession } from "next-auth/react";
import { Camera, Loader2 } from "lucide-react";

interface PersonalProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    photo: string;
  };
}

export function PersonalProfileForm({ user }: PersonalProfileFormProps) {
  const { update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    mobile: user.mobile || "",
    photo: user.photo || "",
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "foundation/profiles");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (result.secure_url) {
        const saveRes = await saveUserProfile(user.id, { photo: result.secure_url });
        if (!saveRes.success) {
          throw new Error(saveRes.error || "Failed to save profile picture");
        }
        setFormData((prev) => ({ ...prev, photo: result.secure_url }));
        await update({ image: result.secure_url });
        toast.success("Profile picture updated successfully!");
      } else {
        throw new Error(result.error || "Failed to upload image");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await saveUserProfile(user.id, formData);
      if (!res.success) {
        throw new Error(res.error || "Failed to update profile");
      }
      await update({ name: formData.name, image: formData.photo });
      toast.success("Personal profile updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Personal Profile"}</CardTitle>
        <CardDescription>
          {"Update your personal details and profile picture."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-sm flex items-center justify-center">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt={"Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center">
                <Label
                  htmlFor="photo-upload"
                  className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {"Change Picture"}</Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{"Full Name"}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">{"Mobile Number"}</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">{"Email Address"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {"Save Changes"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
