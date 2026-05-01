"use client";

import { FileUploader } from "@workspace/ui/components/file-uploader";
import { uploadImage } from "@/lib/upload-image";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ value, onChange, maxFiles = 5 }: ImageUploaderProps) {
  return (
    <FileUploader value={value} onChange={onChange} uploadFn={uploadImage} maxFiles={maxFiles} />
  );
}
