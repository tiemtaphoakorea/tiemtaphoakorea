"use client";

import { axios } from "@workspace/shared/api-client";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import { cn } from "@workspace/ui/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

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
      toast.error(`Chỉ được tải lên tối đa ${maxFiles} ảnh`);
      return;
    }

    setIsUploading(true);
    const uploadRequests = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      return {
        fileName: file.name,
        response: (await axios.post(API_ENDPOINTS.COMMON.UPLOAD, formData)) as {
          url: string;
          error?: string;
        },
      };
    });

    const results = await Promise.allSettled(uploadRequests);
    const newUrls: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.response.url) {
          newUrls.push(result.value.response.url);
        } else {
          toast.error("Tải ảnh thất bại");
        }
      } else {
        toast.error("Tải ảnh thất bại");
      }
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
      toast.success("Đã tải ảnh lên");
    }

    if (newUrls.length !== files.length) {
      toast.error("Tải ảnh thất bại");
    }

    setIsUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
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
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
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
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-8 transition-colors hover:bg-slate-50",
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
              <Loader2 className="mb-2 h-10 w-10 animate-spin text-primary" />
              <p className="font-bold">Đang tải ảnh lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <div className="mb-3 rounded-full bg-slate-100 p-4">
                <Upload className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="font-bold text-slate-700">Click để chọn ảnh</h3>
              <p className="text-sm">Hoặc kéo thả vào đây (Tối đa {maxFiles} ảnh)</p>
            </div>
          )}
        </button>
      )}
    </div>
  );
}
