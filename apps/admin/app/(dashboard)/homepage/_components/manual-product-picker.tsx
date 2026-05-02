"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { GripVertical, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type Props = {
  value: string[]; // ordered product ids
  onChange: (ids: string[]) => void;
};

type ProductLite = { id: string; name: string };

export function ManualProductPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 300);
  const [open, setOpen] = useState(false);

  // PaginatedResponse<ProductListItem> uses `.data`, not `.products`
  const productsQuery = useQuery({
    queryKey: queryKeys.products.list(debounced, 1, 20, "all"),
    queryFn: () => adminClient.getProducts({ search: debounced || undefined, limit: 20 }),
    staleTime: 30_000,
  });

  // Cache product name by id so selected items keep their label after user closes search
  const [productCache, setProductCache] = useState<Record<string, ProductLite>>({});

  useEffect(() => {
    const list = productsQuery.data?.data ?? [];
    if (list.length === 0) return;
    setProductCache((prev) => {
      const next = { ...prev };
      for (const p of list) next[p.id] = { id: p.id, name: p.name };
      return next;
    });
  }, [productsQuery.data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = value.indexOf(active.id as string);
    const newIdx = value.indexOf(over.id as string);
    onChange(arrayMove(value, oldIdx, newIdx));
  }

  function add(id: string) {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setOpen(false);
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  // Only show products not already selected
  const candidates = (productsQuery.data?.data ?? []).filter((p) => !value.includes(p.id));

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Thêm sản phẩm
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Tìm sản phẩm..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {productsQuery.isLoading ? "Đang tải..." : "Không có kết quả"}
              </CommandEmpty>
              <CommandGroup>
                {candidates.map((p) => (
                  <CommandItem key={p.id} value={p.id} onSelect={() => add(p.id)}>
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {value.length === 0 && (
              <div className="text-xs italic text-muted-foreground">Chưa có sản phẩm</div>
            )}
            {value.map((id, idx) => (
              <SortableProductItem
                key={id}
                id={id}
                index={idx}
                product={productCache[id]}
                onRemove={() => remove(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableProductItem({
  id,
  index,
  product,
  onRemove,
}: {
  id: string;
  index: number;
  product: ProductLite | undefined;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border bg-white p-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-xs text-muted-foreground">{index + 1}.</span>
      <span className="flex-1 truncate text-sm">{product?.name ?? id}</span>
      <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Xoá">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
