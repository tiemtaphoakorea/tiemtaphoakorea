"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import * as React from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

const EMPTY: string[] = [];

interface FileUploaderProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  /** Async fn that uploads a File and returns its public URL */
  uploadFn: (file: File) => Promise<string>;
  maxFiles?: number;
  accept?: string;
  /** Compact 110px single-image dropzone */
  compact?: boolean;
  hint?: string;
  className?: string;
}

export function FileUploader({
  value = EMPTY,
  onChange,
  uploadFn,
  maxFiles = 5,
  compact = false,
  hint,
  className,
}: FileUploaderProps) {
  "use no memo";
  const [uploading, setUploading] = React.useState(false);
  const disabled = uploading || value.length >= maxFiles;

  const handleFiles = React.useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (value.length + files.length > maxFiles) {
        toast.error(`Chỉ được tải tối đa ${maxFiles} ảnh`);
        return;
      }
      setUploading(true);
      const results = await Promise.allSettled(files.map((f) => uploadFn(f)));
      const newUrls: string[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") newUrls.push(r.value);
        else toast.error("Tải ảnh thất bại");
      }
      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        toast.success("Đã tải ảnh lên");
      }
      setUploading(false);
    },
    [value, maxFiles, uploadFn, onChange],
  );

  // Use react-dropzone's own input (getInputProps) so click handling is managed
  // by the library — avoids Chrome's anti-phishing block on opacity-0 overlays.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: { "image/*": [] },
    maxFiles: maxFiles - value.length,
    disabled,
    multiple: !compact && maxFiles > 1,
  });

  // ── Compact single-image ───────────────────────────────────────────────────
  if (compact) {
    const url = value[0] ?? null;
    return (
      <div
        {...getRootProps()}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-[10px] border-2 border-dashed border-border bg-muted/40 transition-colors",
          isDragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <input {...getInputProps()} />
        <div className="flex h-[110px] flex-col items-center justify-center gap-1">
          {url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="preview"
                className="absolute inset-0 h-full w-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>
            </>
          ) : uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
              {hint && (
                <span className="px-3 text-center text-xs font-medium text-muted-foreground">
                  {hint}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Default multi-image grid ───────────────────────────────────────────────
  return (
    <div className={cn("space-y-4", className)}>
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {value.map((url, idx) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`upload-${idx}`} className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border transition-colors",
            isDragActive && "border-primary bg-primary/5",
          )}
        >
          <input {...getInputProps()} />
          <div
            className={cn(
              "flex w-full flex-col items-center justify-center p-8",
              uploading && "opacity-50",
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Đang tải ảnh lên...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="rounded-full bg-muted p-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {isDragActive ? "Thả ảnh vào đây..." : "Click để chọn ảnh"}
                </p>
                <p className="text-xs">
                  Hoặc kéo thả vào đây
                  {maxFiles > 1 ? ` · Tối đa ${maxFiles} ảnh` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
