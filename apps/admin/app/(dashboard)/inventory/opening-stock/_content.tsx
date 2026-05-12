"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, Boxes, Calculator, Download, PackageCheck, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { MetricStatBar } from "@/components/admin/shared/metric-stat-bar";
import { queryKeys } from "@/lib/query-keys";
import {
  type OpeningStockCsvRow,
  type OpeningStockRow,
  openingStockClient,
} from "@/services/opening-stock.client";

type DraftRow = {
  quantity: string;
  unitCost: string;
  note: string;
};

function formatVnd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseDraftNumber(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".") || 0);
}

function buildDraft(row: OpeningStockRow): DraftRow {
  return {
    quantity: String(row.openingQuantity ?? ""),
    unitCost: String(row.openingUnitCost ?? row.currentCostPrice ?? ""),
    note: row.note ?? "",
  };
}

export default function OpeningStockContent() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 250);
  const [effectiveDate, setEffectiveDate] = useState(todayInputValue());
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [pendingRow, setPendingRow] = useState<OpeningStockRow | null>(null);
  const [previewRows, setPreviewRows] = useState<OpeningStockCsvRow[] | null>(null);
  const [errorRows, setErrorRows] = useState<OpeningStockCsvRow[]>([]);

  const listQuery = useQuery({
    queryKey: queryKeys.admin.inventory.openingStock({ search: debouncedSearch }),
    queryFn: () => openingStockClient.list({ search: debouncedSearch, limit: 200 }),
    staleTime: 30_000,
  });

  const applyMutation = useMutation({
    mutationFn: openingStockClient.apply,
    onSuccess: async () => {
      toast.success("Đã áp dụng tồn đầu kỳ");
      setPendingRow(null);
      setPreviewRows(null);
      setErrorRows([]);
      setDrafts({});
      await queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không thể áp dụng tồn đầu kỳ");
    },
  });

  const previewMutation = useMutation({
    mutationFn: openingStockClient.previewCsv,
    onSuccess: (result) => {
      setPreviewRows(result.validRows);
      setErrorRows(result.errorRows);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không thể đọc CSV");
    },
  });

  const rows = listQuery.data?.data ?? [];
  const summary = listQuery.data?.summary;

  function getDraft(row: OpeningStockRow) {
    return drafts[row.variantId] ?? buildDraft(row);
  }

  function updateDraft(row: OpeningStockRow, patch: Partial<DraftRow>) {
    setDrafts((prev) => ({ ...prev, [row.variantId]: { ...getDraft(row), ...patch } }));
  }

  function rowPayload(row: OpeningStockRow) {
    const draft = getDraft(row);
    return {
      variantId: row.variantId,
      quantity: parseDraftNumber(draft.quantity),
      unitCost: parseDraftNumber(draft.unitCost),
      effectiveDate,
      note: draft.note || null,
    };
  }

  function saveRow(row: OpeningStockRow) {
    const payload = rowPayload(row);
    if (!Number.isInteger(payload.quantity) || payload.quantity < 0) {
      toast.error("Số lượng phải là số nguyên không âm");
      return;
    }
    if (!Number.isFinite(payload.unitCost) || payload.unitCost < 0) {
      toast.error("Giá vốn phải là số không âm");
      return;
    }
    if (row.openingQuantity != null) {
      setPendingRow(row);
      return;
    }
    applyMutation.mutate([payload]);
  }

  function applyPendingRow() {
    if (!pendingRow) return;
    applyMutation.mutate([rowPayload(pendingRow)]);
  }

  function downloadTemplate() {
    const blob = new Blob(
      ["sku,openingQuantity,openingUnitCost,note\nSKU-001,10,50000,Kiểm kê đầu kỳ\n"],
      {
        type: "text/csv;charset=utf-8",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "opening-stock-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFileChange(file: File | undefined) {
    if (!file) return;
    previewMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function applyPreviewRows() {
    if (!previewRows || previewRows.length === 0) return;
    applyMutation.mutate(
      previewRows.map((row) => ({
        variantId: row.variantId!,
        quantity: row.openingQuantity,
        unitCost: row.openingUnitCost,
        effectiveDate,
        note: row.note,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={ADMIN_ROUTES.INVENTORY}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Quản lý kho
          </Link>
          <h1 className="text-2xl font-semibold tracking-normal">Tồn đầu kỳ</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            data-testid="opening-stock-template"
          >
            <Download className="h-4 w-4" />
            Tải CSV mẫu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={previewMutation.isPending}
            data-testid="opening-stock-import-button"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            data-testid="opening-stock-file-input"
            onChange={(event) => onFileChange(event.target.files?.[0])}
          />
        </div>
      </div>

      <MetricStatBar
        items={[
          {
            label: "Tổng SKU",
            value: summary?.totalVariants ?? "—",
            icon: <Boxes className="h-3.5 w-3.5" />,
            iconClassName: "bg-primary/10 text-primary",
          },
          {
            label: "Đã nhập đầu kỳ",
            value: summary?.enteredVariants ?? "—",
            icon: <PackageCheck className="h-3.5 w-3.5" />,
            iconClassName: "bg-emerald-500/10 text-emerald-600",
          },
          {
            label: "Tổng lượng",
            value: summary?.totalQuantity ?? "—",
            icon: <Boxes className="h-3.5 w-3.5" />,
            iconClassName: "bg-amber-500/10 text-amber-600",
          },
          {
            label: "Giá trị tồn đầu kỳ",
            value: formatVnd(summary?.totalValue),
            icon: <Calculator className="h-3.5 w-3.5" />,
            iconClassName: "bg-sky-500/10 text-sky-600",
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 sm:w-80">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm SKU, sản phẩm..."
            className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
            data-testid="opening-stock-search"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Ngày hiệu lực</span>
          <Input
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
            className="h-9 w-40"
            data-testid="opening-stock-effective-date"
          />
        </label>
      </div>

      <Card className="overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table data-testid="opening-stock-table">
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Tồn hiện tại</TableHead>
                <TableHead className="text-right">SL đầu kỳ</TableHead>
                <TableHead className="text-right">Giá vốn đầu kỳ</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading && <TableLoadingRows cols={8} rows={8} />}
              {listQuery.error && <TableErrorRow cols={8} message={String(listQuery.error)} />}
              {!listQuery.isLoading && rows.length === 0 && (
                <TableEmptyRow cols={8} message="Không tìm thấy SKU" />
              )}
              {rows.map((row) => {
                const draft = getDraft(row);
                const quantity = parseDraftNumber(draft.quantity);
                const unitCost = parseDraftNumber(draft.unitCost);
                return (
                  <TableRow key={row.variantId} data-testid={`opening-stock-row-${row.sku}`}>
                    <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.productName}</span>
                        <span className="text-xs text-muted-foreground">{row.variantName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.currentOnHand}</TableCell>
                    <TableCell className="min-w-28">
                      <Input
                        value={draft.quantity}
                        onChange={(event) => updateDraft(row, { quantity: event.target.value })}
                        inputMode="numeric"
                        className="h-9 text-right tabular-nums"
                        data-testid={`opening-stock-quantity-${row.sku}`}
                      />
                    </TableCell>
                    <TableCell className="min-w-36">
                      <Input
                        value={draft.unitCost}
                        onChange={(event) => updateDraft(row, { unitCost: event.target.value })}
                        inputMode="decimal"
                        className="h-9 text-right tabular-nums"
                        data-testid={`opening-stock-unit-cost-${row.sku}`}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVnd(quantity * unitCost)}
                    </TableCell>
                    <TableCell className="min-w-48">
                      <Input
                        value={draft.note}
                        onChange={(event) => updateDraft(row, { note: event.target.value })}
                        className="h-9"
                        data-testid={`opening-stock-note-${row.sku}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => saveRow(row)}
                        disabled={applyMutation.isPending}
                        data-testid={`opening-stock-apply-${row.sku}`}
                      >
                        Áp dụng
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={Boolean(pendingRow)} onOpenChange={(open) => !open && setPendingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận sửa tồn đầu kỳ</DialogTitle>
            <DialogDescription>
              SKU này đã có tồn đầu kỳ. Khi lưu, hệ thống sẽ tính lại chuỗi tồn kho sau ngày hiệu
              lực.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRow(null)}>
              Hủy
            </Button>
            <Button
              onClick={applyPendingRow}
              disabled={applyMutation.isPending}
              data-testid="opening-stock-confirm-apply"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewRows !== null} onOpenChange={(open) => !open && setPreviewRows(null)}>
        <DialogContent className="sm:max-w-3xl" data-testid="opening-stock-preview-modal">
          <DialogHeader>
            <DialogTitle>Preview import CSV</DialogTitle>
            <DialogDescription>
              {previewRows?.length ?? 0} dòng hợp lệ · {errorRows.length} dòng lỗi
            </DialogDescription>
          </DialogHeader>
          {errorRows.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-lg border border-destructive/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dòng</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorRows.map((row) => (
                    <TableRow
                      key={`${row.rowNumber}-${row.sku}`}
                      data-testid="opening-stock-error-row"
                    >
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{row.sku || "—"}</TableCell>
                      <TableCell className="text-destructive">{row.errors.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Giá trị hợp lệ:{" "}
            {formatVnd(
              previewRows?.reduce(
                (sum, row) => sum + row.openingQuantity * row.openingUnitCost,
                0,
              ) ?? 0,
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewRows(null)}>
              Đóng
            </Button>
            <Button
              onClick={applyPreviewRows}
              disabled={!previewRows?.length || errorRows.length > 0 || applyMutation.isPending}
              data-testid="opening-stock-preview-apply"
            >
              Áp dụng CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
