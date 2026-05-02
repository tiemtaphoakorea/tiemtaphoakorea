"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, GripVertical, ImageIcon, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import type { BannerAdminItem } from "@/services/admin.client";
import { BannerFormPanel } from "./banner-form-panel";

type Props = {
  banner: BannerAdminItem;
  isEditing: boolean;
  onEdit: () => void;
  onCloseEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
};

export function BannerRow({ banner, isEditing, onEdit, onCloseEdit, onDelete, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = banner.type === "category" ? `Danh mục · ${banner.categoryName ?? "?"}` : "Custom";
  const thumb = banner.imageUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-lg border bg-white",
        isEditing ? "border-primary shadow-sm" : "border-border",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isEditing ? "cursor-not-allowed opacity-40" : "cursor-grab",
          )}
          aria-label="Kéo để sắp xếp"
          disabled={isEditing}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Thumbnail */}
        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {thumb ? (
            <Image src={thumb} alt={banner.title ?? ""} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {banner.title || "(chưa có tiêu đề)"}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>

        <Switch checked={banner.isActive} onCheckedChange={onToggle} disabled={isEditing} />

        <Button
          variant="ghost-primary"
          size="sm"
          onClick={isEditing ? onCloseEdit : onEdit}
          aria-label={isEditing ? "Đóng" : "Sửa"}
        >
          {isEditing ? (
            <ChevronDown className="h-3.5 w-3.5 rotate-180 transition-transform" />
          ) : (
            <Pencil className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button variant="ghost-destructive" size="sm" onClick={onDelete} aria-label="Xoá" disabled={isEditing}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isEditing && <BannerFormPanel bannerId={banner.id} onClose={onCloseEdit} />}
    </div>
  );
}
