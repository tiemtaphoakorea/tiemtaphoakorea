"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Supplier } from "@workspace/database/types/admin";
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
import { Building2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { SupplierDrawer } from "@/components/admin/shared/supplier-drawer";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AdminSuppliers() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({
    queryKey: queryKeys.suppliers.list(debouncedQuery),
    queryFn: async () => await adminClient.getSuppliers({ search: debouncedQuery || undefined }),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });

  const list: Supplier[] = suppliersQuery.data?.suppliers ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhà cung cấp..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[200px]"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {suppliersQuery.isLoading ? "Đang tải..." : `${list.length} nhà cung cấp`}
        </span>
        <Button className="h-[34px] gap-1.5 sm:ml-auto" onClick={() => setEditing(null)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Thêm nhà CC
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {["Nhà cung cấp", "Mã", "SĐT", "Email", "Số đơn", "Trạng thái", ""].map((h, i) => (
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
              {suppliersQuery.isLoading && <TableLoadingRows cols={7} rows={5} />}
              {suppliersQuery.error && (
                <TableErrorRow cols={7} message={String(suppliersQuery.error)} />
              )}
              {!suppliersQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={7} message="Chưa có nhà cung cấp" />
              )}
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-semibold">{s.name}</span>
                        {s.address && (
                          <span className="text-[11px] text-muted-foreground">{s.address}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {s.code}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs">{s.phone ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {s.email ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums">{s.totalOrders} đơn</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusBadge type={s.isActive ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md text-xs"
                        onClick={() => setEditing(s)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        className="h-7 rounded-md border-red-200 bg-red-100 text-xs text-red-600 hover:bg-red-200"
                        onClick={() => setDeleteTarget(s)}
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

      <SupplierDrawer
        open={editing !== undefined}
        supplier={editing ?? null}
        onClose={() => setEditing(undefined)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Xoá nhà CC "${deleteTarget?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
