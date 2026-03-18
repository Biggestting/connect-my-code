import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EventFallbackImage } from "./EventFallbackImage";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  userId?: string;
  folder?: string;
  label?: string;
  /** Fallback card props when no image */
  fallbackTitle?: string;
  fallbackDate?: string;
  fallbackLocation?: string;
  fallbackCategory?: string;
}

export function ImageUploadField({
  value,
  onChange,
  userId,
  folder = "events",
  label = "Event Image",
  fallbackTitle,
  fallbackDate,
  fallbackLocation,
  fallbackCategory,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId || "anonymous"}/${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Preview */}
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-border bg-muted">
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <EventFallbackImage
            title={fallbackTitle || ""}
            date={fallbackDate}
            location={fallbackLocation}
            category={fallbackCategory}
          />
        )}
      </div>

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {uploading ? "Uploading..." : value ? "Replace Image" : "Upload Image"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          JPG, PNG, WebP · Max 5MB · 1200×675 recommended
        </span>
      </div>
    </div>
  );
}
