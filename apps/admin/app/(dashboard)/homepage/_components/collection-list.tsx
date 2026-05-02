"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { CollectionRow, type CollectionRowData } from "./collection-row";

type Props = {
  collections: CollectionRowData[];
  isLoading: boolean;
  onEdit: (id: string) => void;
};

export function CollectionList({ collections, isLoading, onEdit }: Props) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CollectionRowData[]>(collections);
  const [deleteTarget, setDeleteTarget] = useState<CollectionRowData | null>(null);

  // Keep local order in sync with server data when content changes outside of drag
  if (
    items.length !== collections.length ||
    items.some((item, i) => item.id !== collections[i]?.id)
  ) {
    setItems(collections);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => adminClient.reorderHomepageCollections(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminClient.updateHomepageCollection(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteHomepageCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
      setDeleteTarget(null);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    reorderMutation.mutate(next.map((c) => c.id));
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (items.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">Chưa có collection nào.</div>;
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((c) => (
            <CollectionRow
              key={c.id}
              collection={c}
              onEdit={() => onEdit(c.id)}
              onDelete={() => setDeleteTarget(c)}
              onToggle={(isActive) => toggleMutation.mutate({ id: c.id, isActive })}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* ConfirmDialog has no description/onCancel — use onOpenChange to close */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Xoá "${deleteTarget?.title}"?`}
        confirmLabel="Xoá"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </>
  );
}
