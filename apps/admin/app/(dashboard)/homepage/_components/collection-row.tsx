"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

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
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
};

export function CollectionRow({ collection, onEdit, onDelete, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: collection.id,
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
      className="flex items-center gap-3 border-b border-border bg-white p-3 last:border-b-0"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{collection.title}</div>
        <div className="text-xs text-muted-foreground">{meta.join(" · ")}</div>
      </div>

      <Switch checked={collection.isActive} onCheckedChange={onToggle} />

      <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Sửa">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Xoá">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
