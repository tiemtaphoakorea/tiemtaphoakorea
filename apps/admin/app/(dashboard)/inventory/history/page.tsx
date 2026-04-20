"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient, type InventoryMovement } from "@/services/admin.client";

const MOVEMENT_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  stock_out: { label: "Xuất kho", variant: "destructive" },
  supplier_receipt: { label: "Nhập hàng", variant: "default" },
  manual_adjustment: { label: "Điều chỉnh", variant: "secondary" },
  cancellation: { label: "Hoàn hàng", variant: "outline" },
};

const movementColumns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("vi-VN"),
  },
  {
    accessorKey: "variantSku",
    header: "SKU",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.variantSku}</div>
        <div className="text-xs text-muted-foreground">{row.original.variantName}</div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const cfg = MOVEMENT_LABELS[row.original.type];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Số lượng",
    cell: ({ row }) => {
      const qty = row.original.quantity;
      return (
        <span className={qty > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {qty > 0 ? `+${qty}` : qty}
        </span>
      );
    },
  },
  {
    id: "onHand",
    header: "Tồn kho",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.original.onHandBefore} → {row.original.onHandAfter}
      </span>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Người thực hiện",
    cell: ({ row }) => row.original.createdByName ?? "Hệ thống",
  },
  {
    accessorKey: "note",
    header: "Ghi chú",
    cell: ({ row }) => row.original.note ?? "—",
  },
];

function MovementsTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.admin.inventory.movements({ page, limit }),
    queryFn: () => adminClient.getInventoryMovements({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

  const movements = data?.data ?? [];
  const metadata = data?.metadata;

  return (
    <DataTable
      columns={movementColumns}
      data={movements}
      isLoading={isLoading}
      isFetching={isFetching}
      pageCount={metadata?.totalPages ?? 1}
      pagination={{ pageIndex: page - 1, pageSize: limit }}
      onPaginationChange={(p) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p.pageIndex + 1));
        router.push(`${pathname}?${params.toString()}`);
      }}
      emptyMessage="Chưa có giao dịch kho nào."
    />
  );
}

function DailySummaryTab() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.inventory.dailySummary({}),
    queryFn: () => adminClient.getInventoryDailySummary(),
    staleTime: 1000 * 60 * 5,
  });

  const rows = data?.data ?? [];

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left">Ngày</th>
            <th className="px-4 py-2 text-right text-green-700">Nhập</th>
            <th className="px-4 py-2 text-right text-red-700">Xuất</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                Đang tải...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                Chưa có dữ liệu.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.date} className="border-b">
                <td className="px-4 py-2">{row.date}</td>
                <td className="px-4 py-2 text-right text-green-600 font-medium">
                  +{Number(row.totalIn)}
                </td>
                <td className="px-4 py-2 text-right text-red-600 font-medium">
                  -{Number(row.totalOut)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function InventoryHistoryContent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Lịch sử kho</h1>
        <p className="text-muted-foreground text-sm">Theo dõi nhập xuất tồn kho</p>
      </div>

      <Tabs defaultValue="movements">
        <TabsList>
          <TabsTrigger value="movements">Giao dịch</TabsTrigger>
          <TabsTrigger value="daily">Tổng hợp theo ngày</TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <MovementsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tổng hợp theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <DailySummaryTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function InventoryHistoryPage() {
  return (
    <Suspense fallback={<div />}>
      <InventoryHistoryContent />
    </Suspense>
  );
}
