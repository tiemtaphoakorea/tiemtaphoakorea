"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPPLIER_ORDER_STATUS_ALL } from "@workspace/shared/constants";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Package, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { CreateSupplierOrderDialog } from "./_create-dialog";
import { SupplierOrderDetailDialog } from "./_detail-dialog";
import { formatDate, STATUS_OPTIONS, StatusPill, type SupplierOrderRow } from "./_shared";

export default function SupplierOrdersContent() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [statusFilter, setStatusFilter] = useState<string>(SUPPLIER_ORDER_STATUS_ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: queryKeys.admin.supplierOrders.list(debouncedQuery, statusFilter),
    queryFn: async () =>
      (await adminClient.getSupplierOrders({
        search: debouncedQuery || undefined,
        status: statusFilter,
      })) as unknown as SupplierOrderRow[],
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const list: SupplierOrderRow[] = ordersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo SKU, sản phẩm, ghi chú..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[260px]"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="h-[34px] w-full sm:w-[180px]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <SelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectOption>
          ))}
        </Select>
        <Button className="h-[34px] gap-1.5 sm:ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tạo đơn nhập
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {["Sản phẩm", "SKU", "SL", "Trạng thái", "Ngày dự kiến", "Ngày tạo"].map((h, i) => (
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
              {ordersQuery.isLoading && <TableLoadingRows cols={6} rows={5} />}
              {ordersQuery.error && <TableErrorRow cols={6} message={String(ordersQuery.error)} />}
              {!ordersQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={6} message="Chưa có đơn nhập" />
              )}
              {list.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => setDetailId(o.id)}>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-primary/10">
                        <Package className="h-4 w-4 text-primary" strokeWidth={1.8} />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-semibold">
                          {o.item.productName ?? "—"}
                        </span>
                        {o.item.variantName && (
                          <span className="text-[11px] text-muted-foreground">
                            {o.item.variantName}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {o.item.sku ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums">{o.quantity}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusPill status={o.status} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs">
                    {formatDate(o.expectedDate)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateSupplierOrderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.supplierOrders.all });
        }}
      />

      <SupplierOrderDetailDialog
        id={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.supplierOrders.all });
        }}
      />
    </div>
  );
}
