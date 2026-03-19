"use client";

import { axios } from "@repo/shared/api-client";
import { API_ENDPOINTS } from "@repo/shared/api-endpoints";
import { cn } from "@repo/shared/utils";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

const EMPTY_URLS: string[] = [];

interface ImageUploaderProps {
  value: string[]; // Array of image URLs
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ value = EMPTY_URLS, onChange, maxFiles = 5 }: ImageUploaderProps) {
  "use no memo";
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxFiles) {
      alert(`Bạn chỉ được phép tải lên tối đa ${maxFiles} ảnh.`);
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    // Process uploads sequentially or parallel
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const data = (await axios.post(API_ENDPOINTS.COMMON.UPLOAD, formData)) as {
          url: string;
          error?: string;
        };
        if (data.url) {
          newUrls.push(data.url);
        } else {
          console.error("Upload failed for file:", file.name, data.error);
        }
      }

      onChange([...value, ...newUrls]);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Có lỗi xảy ra khi tải ảnh. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newUrls = [...value];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

  return (
    <div className="space-y-4">
      {/* Grid of Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {value.map((url, idx) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
            >
              <Image
                src={url}
                alt={`Upload ${idx}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button Area */}
      {value.length < maxFiles && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-8 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/50",
            isUploading && "pointer-events-none opacity-50",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {isUploading ? (
            <div className="flex flex-col items-center text-slate-500">
              <Loader2 className="text-primary mb-2 h-10 w-10 animate-spin" />
              <p className="font-bold">Đang tải ảnh lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <div className="mb-3 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <Upload className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Click để chọn ảnh</h3>
              <p className="text-sm">Hoặc kéo thả vào đây (Tối đa {maxFiles} ảnh)</p>
            </div>
          )}
        </button>
      )}
    </div>
  );
}
