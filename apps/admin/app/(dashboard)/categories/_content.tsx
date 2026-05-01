"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryWithChildren } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { CategoryDrawer } from "@/components/admin/shared/category-drawer";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AdminCategories() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [editing, setEditing] = useState<CategoryWithChildren | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithChildren | null>(null);
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(debouncedQuery),
    queryFn: async () => await adminClient.getCategories({ search: debouncedQuery || undefined }),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });

  // Use flatCategories for display — depth + indentation handled below.
  const list: CategoryWithChildren[] = categoriesQuery.data?.flatCategories ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm danh mục..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[200px]"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {categoriesQuery.isLoading ? "Đang tải..." : `${list.length} danh mục`}
        </span>
        <Button className="h-[34px] gap-1.5 sm:ml-auto" onClick={() => setEditing(null)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Thêm danh mục
        </Button>
      </div>

      <Card className="overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {["Danh mục", "Slug URL", "Thứ tự", "Trạng thái", ""].map((h, i) => (
                  <TableHead
                    key={i}
                    className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesQuery.isLoading && <TableLoadingRows cols={5} rows={6} />}
              {categoriesQuery.error && (
                <TableErrorRow cols={5} message={String(categoriesQuery.error)} />
              )}
              {!categoriesQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={5} message="Chưa có danh mục" />
              )}
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {c.imageUrl ? (
                        // biome-ignore lint/performance/noImgElement: CMS icon URLs
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="h-7 w-7 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded bg-primary/10 text-primary">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-[13px] font-semibold">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {c.slug}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {c.displayOrder}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusBadge type={c.isActive ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md text-xs"
                        onClick={() => setEditing(c)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        className="h-7 rounded-md border-red-200 bg-red-100 text-xs text-red-600 hover:bg-red-200"
                        onClick={() => setDeleteTarget(c)}
                      >
                        Xoá
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CategoryDrawer
        open={editing !== undefined}
        category={editing ?? null}
        onClose={() => setEditing(undefined)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Xoá danh mục "${deleteTarget?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
