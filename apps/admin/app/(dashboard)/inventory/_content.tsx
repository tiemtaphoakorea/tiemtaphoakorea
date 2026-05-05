"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
  thumbLabelFromName,
  thumbToneFromId,
} from "@/components/admin/shared/data-state";
import { MetricStatBar } from "@/components/admin/shared/metric-stat-bar";
import { ProductThumb } from "@/components/admin/shared/product-thumb";
import { TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type WarehouseTab = "stock" | "low" | "out";
const TABS: ReadonlyArray<{ id: WarehouseTab; label: string }> = [
  { id: "stock", label: "Tồn kho" },
  { id: "low", label: "Sắp hết" },
  { id: "out", label: "Hết hàng" },
];

export default function AdminInventory() {
  const router = useRouter();
  const [tab, setTab] = useState<WarehouseTab>("stock");

  const stockQuery = useQuery({
    queryKey: queryKeys.admin.stockAlerts,
    queryFn: () => adminClient.getStockAlerts(),
    staleTime: 60_000,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list("", 1, 50, "all"),
    queryFn: async () => await adminClient.getProducts({ page: 1, limit: 50 }),
    enabled: tab === "stock",
    staleTime: 60_000,
  });

  const lowStock = stockQuery.data?.lowStock ?? [];
  const outOfStock = stockQuery.data?.outOfStock ?? [];
  const products = productsQuery.data?.data ?? [];
  const totalSkus = productsQuery.data?.metadata.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription className="text-destructive">
            <b className="font-bold">{lowStock.length} SP sắp hết</b>
            {outOfStock.length > 0 && (
              <>
                {" · "}
                <b className="font-bold">{outOfStock.length} SP đã hết hàng</b>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <MetricStatBar
        items={[
          {
            label: "Tổng SKU",
            value: totalSkus || "—",
            icon: <Package className="h-3.5 w-3.5" />,
            iconClassName: "bg-primary/10 text-primary",
            trend: { text: "Đang quản lý", className: "text-muted-foreground" },
          },
          {
            label: "Còn hàng",
            value: Math.max(0, totalSkus - lowStock.length - outOfStock.length),
            icon: <Package className="h-3.5 w-3.5" />,
            iconClassName: "bg-emerald-500/10 text-emerald-600",
            trend: { text: "Đủ tồn kho", className: "text-muted-foreground" },
          },
          {
            label: "Sắp hết",
            value: lowStock.length,
            icon: <Package className="h-3.5 w-3.5" />,
            iconClassName: "bg-amber-500/10 text-amber-600",
            trend: { text: "Cần nhập sớm", className: "text-amber-600" },
          },
          {
            label: "Hết hàng",
            value: outOfStock.length,
            icon: <Package className="h-3.5 w-3.5" />,
            iconClassName: "bg-red-500/10 text-red-500",
            trend: { text: "Cần nhập gấp", className: "text-red-600" },
          },
        ]}
      />

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as WarehouseTab)}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            className="h-7 gap-1.5 rounded-md text-xs"
            onClick={() => router.push("/supplier-orders")}
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
            Nhập hàng
          </Button>
        </div>

        {tab !== "stock" && (
          <p className="border-b border-border bg-muted/30 px-5 py-2 text-xs text-muted-foreground">
            Hiển thị 10 SKU cần xử lý nhất · Số liệu đầy đủ theo variant tại{" "}
            <a href="/analytics/inventory" className="font-medium underline underline-offset-2">
              Báo cáo Tồn kho
            </a>
          </p>
        )}

        {tab === "stock" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Sản phẩm", "Danh mục", "Tồn khả dụng", "Tồn vật lý", "Đã giữ chỗ"].map(
                    (h, i) => (
                      <TableHead key={i}>{h}</TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQuery.isLoading && <TableLoadingRows cols={5} rows={6} />}
                {productsQuery.error && (
                  <TableErrorRow cols={5} message={String(productsQuery.error)} />
                )}
                {!productsQuery.isLoading && products.length === 0 && (
                  <TableEmptyRow cols={5} message="Chưa có dữ liệu kho" />
                )}
                {products.map((p) => {
                  const stockClass =
                    p.totalAvailable === 0
                      ? "text-red-600 font-bold"
                      : p.totalAvailable < (p.minLowStockThreshold ?? 30)
                        ? "text-amber-700 font-bold"
                        : "text-foreground font-bold";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <ProductThumb
                            label={thumbLabelFromName(p.name)}
                            tone={thumbToneFromId(p.id)}
                          />
                          <span className="text-sm font-semibold">
                            {p.name.length > 40 ? `${p.name.slice(0, 40)}…` : p.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        {p.categoryName ? (
                          <TonePill tone="indigo">{p.categoryName}</TonePill>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className={`px-4 py-2.5 tabular-nums ${stockClass}`}>
                        {p.totalAvailable}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 tabular-nums">{p.totalOnHand}</TableCell>
                      <TableCell className="px-4 py-2.5 tabular-nums text-muted-foreground">
                        {p.totalReserved}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Sản phẩm / SKU", "Tồn", "Tình trạng"].map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockQuery.isLoading && <TableLoadingRows cols={3} rows={5} />}
                {stockQuery.error && <TableErrorRow cols={3} message={String(stockQuery.error)} />}
                {!stockQuery.isLoading && (tab === "low" ? lowStock : outOfStock).length === 0 && (
                  <TableEmptyRow
                    cols={3}
                    message={tab === "low" ? "Không có SP sắp hết" : "Không có SP hết hàng"}
                  />
                )}
                {(tab === "low" ? lowStock : outOfStock).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ProductThumb
                          label={thumbLabelFromName(v.productName)}
                          tone={thumbToneFromId(v.id)}
                        />
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-semibold">{v.productName}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {v.name} · {v.sku ?? "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`px-4 py-2.5 font-bold tabular-nums ${tab === "out" ? "text-red-600" : "text-amber-700"}`}
                    >
                      {v.onHand}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <TonePill tone={tab === "out" ? "red" : "amber"}>
                        {tab === "out" ? "Hết hàng" : "Sắp hết"}
                      </TonePill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
