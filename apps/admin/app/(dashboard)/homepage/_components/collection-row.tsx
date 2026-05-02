"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, GripVertical, Pencil, Trash2 } from "lucide-react";
import { CollectionFormPanel } from "./collection-form-panel";

const TYPE_LABELS: Record<string, string> = {
  manual: "Thủ công",
  best_sellers: "Bán chạy",
  new_arrivals: "Mới về",
  by_category: "Theo danh mục",
};

export type CollectionRowData = {
  id: string;
  type: keyof typeof TYPE_LABELS;
  title: string;
  isActive: boolean;
  itemLimit: number;
  productCount: number;
  daysWindow: number | null;
  categoryId: string | null;
};

type Props = {
  collection: CollectionRowData;
  isEditing: boolean;
  onEdit: () => void;
  onCloseEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
};

export function CollectionRow({
  collection,
  isEditing,
  onEdit,
  onCloseEdit,
  onDelete,
  onToggle,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: collection.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta: string[] = [TYPE_LABELS[collection.type] ?? collection.type];
  meta.push(`limit ${collection.itemLimit}`);
  if (collection.type === "manual") meta.push(`${collection.productCount} sản phẩm`);
  if (collection.type === "new_arrivals") meta.push(`${collection.daysWindow ?? 30} ngày`);

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

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{collection.title}</div>
          <div className="text-xs text-muted-foreground">{meta.join(" · ")}</div>
        </div>

        <Switch checked={collection.isActive} onCheckedChange={onToggle} disabled={isEditing} />

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

      {isEditing && <CollectionFormPanel collectionId={collection.id} onClose={onCloseEdit} />}
    </div>
  );
}
