/**
 * CloudinaryUpload
 *
 * A drop-in replacement for a plain URL <Input> wherever images/files need to
 * be uploaded to Cloudinary via the NestJS backend.
 *
 * Usage:
 *   <CloudinaryUpload
 *     value={form.coverUrl ?? ""}
 *     onChange={(url) => setForm(f => ({ ...f, coverUrl: url }))}
 *     accept="image/*"
 *     category="update_photo"
 *     label="Cover image"
 *   />
 *
 * The component:
 *   1. Lets the admin type/paste a URL directly (legacy compat)
 *   2. OR pick a local file → uploads to POST /api/upload → sets the returned
 *      secure_url as the value
 *
 * POST /api/upload is a thin NestJS endpoint that wraps CloudinaryService and
 * requires auth. It accepts `file` + `category` form fields.
 */

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAccessToken } from "@/lib/api/client";

const BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:4000/api";

export type UploadCategory =
  | "update_photo"
  | "kyc_photo"
  | "kyc_id"
  | "kyc_utility"
  | "other";

interface CloudinaryUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  category?: UploadCategory;
  /** Max file size in bytes — default 10 MB */
  maxSize?: number;
  className?: string;
}

export function CloudinaryUpload({
  value,
  onChange,
  label,
  accept = "image/*",
  category = "other",
  maxSize = 10 * 1024 * 1024,
  className,
}: CloudinaryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage =
    !!value && /\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(value);

  const handleFile = async (file: File) => {
    if (file.size > maxSize) {
      setError(`File too large (max ${Math.round(maxSize / 1024 / 1024)} MB)`);
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);

      const token = getAccessToken();
      const res = await fetch(`${BASE}/upload`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? `Upload failed (${res.status})`);
      }

      const data = await res.json();
      onChange(data.secureUrl ?? data.url ?? "");
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {label && <Label className="mb-1.5 block">{label}</Label>}

      {/* URL text input */}
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or upload a file →"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <span className="text-xs">Uploading…</span>
          ) : (
            <>
              <Upload className="mr-1 h-3.5 w-3.5" />
              Upload
            </>
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange("")}
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // reset so the same file can be re-selected
          e.target.value = "";
        }}
      />

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}

      {/* Preview */}
      {isImage && (
        <div className="mt-2 overflow-hidden rounded-md border border-border bg-muted/30">
          <img
            src={value}
            alt="Preview"
            className="max-h-40 w-full object-contain"
            onError={() => {/* silently ignore broken preview */}}
          />
        </div>
      )}
      {value && !isImage && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          <a href={value} target="_blank" rel="noreferrer" className="underline">
            Preview file
          </a>
        </p>
      )}
    </div>
  );
}
