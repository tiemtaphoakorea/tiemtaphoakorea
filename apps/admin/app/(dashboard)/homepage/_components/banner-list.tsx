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
import { adminClient, type BannerAdminItem } from "@/services/admin.client";
import { BannerRow } from "./banner-row";

type Props = {
  banners: BannerAdminItem[];
  isLoading: boolean;
  editingId: string | null | undefined;
  onEdit: (id: string) => void;
  onCloseEdit: () => void;
};

type ListCache = { banners: BannerAdminItem[] };

export function BannerList({ banners, isLoading, editingId, onEdit, onCloseEdit }: Props) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<BannerAdminItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => adminClient.reorderBanners(ids),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.banners.all }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminClient.updateBanner(id, { isActive }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.banners.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteBanner(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
      setDeleteTarget(null);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = banners.findIndex((b) => b.id === active.id);
    const newIdx = banners.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const next = arrayMove(banners, oldIdx, newIdx);
    queryClient.setQueryData<ListCache>(queryKeys.banners.list, (prev) =>
      prev ? { ...prev, banners: next } : prev,
    );
    reorderMutation.mutate(next.map((b) => b.id));
  }

  function handleToggle(id: string, isActive: boolean) {
    queryClient.setQueryData<ListCache>(queryKeys.banners.list, (prev) =>
      prev ? { ...prev, banners: prev.banners.map((b) => (b.id === id ? { ...b, isActive } : b)) } : prev,
    );
    toggleMutation.mutate({ id, isActive });
  }

  if (isLoading || banners.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        {isLoading ? "Đang tải..." : "Chưa có banner nào."}
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {banners.map((b) => (
              <BannerRow
                key={b.id}
                banner={b}
                isEditing={editingId === b.id}
                onEdit={() => onEdit(b.id)}
                onCloseEdit={onCloseEdit}
                onDelete={() => setDeleteTarget(b)}
                onToggle={(isActive) => handleToggle(b.id, isActive)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Xoá banner "${deleteTarget?.title ?? "này"}"?`}
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xoá"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </>
  );
}
