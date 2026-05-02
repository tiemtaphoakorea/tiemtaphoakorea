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
  editingId: string | null | undefined;
  onEdit: (id: string) => void;
  onCloseEdit: () => void;
};

type ListCache = { collections: CollectionRowData[] };

export function CollectionList({ collections, isLoading, editingId, onEdit, onCloseEdit }: Props) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<CollectionRowData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => adminClient.reorderHomepageCollections(ids),
    // Roll back to server truth on either outcome
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminClient.updateHomepageCollection(id, { isActive }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteHomepageCollection(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
      setDeleteTarget(null);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = collections.findIndex((i) => i.id === active.id);
    const newIdx = collections.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const next = arrayMove(collections, oldIdx, newIdx);
    // Optimistic write to the React Query cache so UI reflects the new order immediately
    queryClient.setQueryData<ListCache>(queryKeys.homepageCollections.list, (prev) =>
      prev ? { ...prev, collections: next } : prev,
    );
    reorderMutation.mutate(next.map((c) => c.id));
  }

  function handleToggle(id: string, isActive: boolean) {
    queryClient.setQueryData<ListCache>(queryKeys.homepageCollections.list, (prev) =>
      prev
        ? {
            ...prev,
            collections: prev.collections.map((c) => (c.id === id ? { ...c, isActive } : c)),
          }
        : prev,
    );
    toggleMutation.mutate({ id, isActive });
  }

  if (isLoading || collections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        {isLoading ? "Đang tải..." : "Chưa có collection nào."}
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={collections.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {collections.map((c) => (
              <CollectionRow
                key={c.id}
                collection={c}
                isEditing={editingId === c.id}
                onEdit={() => onEdit(c.id)}
                onCloseEdit={onCloseEdit}
                onDelete={() => setDeleteTarget(c)}
                onToggle={(isActive) => handleToggle(c.id, isActive)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Xoá collection "${deleteTarget?.title}"?`}
        description="Hành động này không thể hoàn tác. Collection sẽ bị xoá khỏi trang chủ."
        confirmLabel="Xoá"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </>
  );
}
