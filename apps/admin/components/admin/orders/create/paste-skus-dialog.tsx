"use client";

import type { OrderProductSelection, OrderProductVariant } from "@workspace/database/types/order";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { AlertCircle, CheckCircle2, Loader2, Repeat } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { adminClient } from "@/services/admin.client";

interface PasteSkusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItems: (
    items: Array<{
      variant: OrderProductVariant;
      product: OrderProductSelection;
      quantity: number;
    }>,
  ) => void;
}

interface ParsedLine {
  raw: string;
  sku: string;
  quantity: number;
}

interface MatchedRow extends ParsedLine {
  variant: OrderProductVariant;
  product: OrderProductSelection;
}

interface ParseResult {
  matched: MatchedRow[];
  unmatched: ParsedLine[];
  duplicates: ParsedLine[];
}

function parseInput(text: string): ParsedLine[] {
  const lines: ParsedLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/[,;\t]+/).map((p) => p.trim());
    const sku = parts[0] ?? "";
    if (!sku) continue;
    const qty = parts[1] ? Number.parseInt(parts[1], 10) : 1;
    lines.push({
      raw: trimmed,
      sku,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
    });
  }
  return lines;
}

export function PasteSkusDialog({ open, onOpenChange, onAddItems }: PasteSkusDialogProps) {
  const [text, setText] = React.useState("");
  const [analysed, setAnalysed] = React.useState<ParseResult | null>(null);
  const [isAnalysing, setIsAnalysing] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setText("");
      setAnalysed(null);
      setIsAnalysing(false);
    }
  }, [open]);

  const handleAnalyse = async () => {
    const lines = parseInput(text);
    if (lines.length === 0) {
      toast.error("Chưa có dòng SKU hợp lệ.");
      return;
    }

    setIsAnalysing(true);
    try {
      const uniqueSkus = Array.from(new Set(lines.map((l) => l.sku.toLowerCase())));
      const { variants } = await adminClient.lookupVariantsBySkus(uniqueSkus);

      // Build SKU → resolved variant entry (server returns flattened shape)
      type LookupEntry = (typeof variants)[number];
      const skuMap = new Map<string, LookupEntry>();
      for (const v of variants) {
        skuMap.set(v.sku.toLowerCase(), v);
      }

      const matched: MatchedRow[] = [];
      const unmatched: ParsedLine[] = [];
      const duplicates: ParsedLine[] = [];
      const seen = new Set<string>();

      for (const line of lines) {
        const key = line.sku.toLowerCase();
        const hit = skuMap.get(key);
        if (!hit) {
          unmatched.push(line);
          continue;
        }
        if (seen.has(key)) {
          duplicates.push(line);
          const existing = matched.find((m) => m.variant.id === hit.id);
          if (existing) existing.quantity += line.quantity;
          continue;
        }
        seen.add(key);
        matched.push({
          ...line,
          variant: {
            id: hit.id,
            name: hit.name,
            sku: hit.sku,
            price: hit.price,
            onHand: hit.onHand,
            reserved: hit.reserved,
            images: [],
          },
          product: {
            id: hit.productId,
            name: hit.productName,
            variants: [],
          },
        });
      }

      setAnalysed({ matched, unmatched, duplicates });
    } catch (error: any) {
      toast.error(error?.message || "Tra cứu SKU thất bại.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleAddAll = () => {
    if (!analysed || analysed.matched.length === 0) return;
    onAddItems(
      analysed.matched.map(({ variant, product, quantity }) => ({ variant, product, quantity })),
    );
    toast.success(`Đã thêm ${analysed.matched.length} dòng vào đơn`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dán danh sách SKU</DialogTitle>
          <DialogDescription>
            Mỗi dòng 1 SKU, kèm số lượng sau dấu phẩy. Bỏ qua dòng bắt đầu bằng <code>#</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder={"SKU-001,2\nSKU-009,1\n# Áo thun mùa hè\nSKU-021"}
            className="min-h-40 font-mono text-sm"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setAnalysed(null);
            }}
          />
          {analysed && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {analysed.matched.length} hợp lệ
                </Badge>
                {analysed.unmatched.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> {analysed.unmatched.length} không tìm thấy
                  </Badge>
                )}
                {analysed.duplicates.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Repeat className="h-3 w-3" /> {analysed.duplicates.length} trùng (gộp số lượng)
                  </Badge>
                )}
              </div>
              {analysed.unmatched.length > 0 && (
                <div className="rounded-sm bg-destructive/5 p-2 text-xs text-destructive">
                  SKU không tìm thấy:{" "}
                  <span className="font-mono">
                    {analysed.unmatched.map((l) => l.sku).join(", ")}
                  </span>
                </div>
              )}
              {analysed.matched.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {analysed.matched.map((m) => (
                    <li key={m.variant.id} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground tabular-nums">×{m.quantity}</span>
                      <span className="truncate">
                        {m.product.name} · {m.variant.name || "Mặc định"}
                      </span>
                      <span className="ml-auto font-mono text-muted-foreground">{m.sku}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Huỷ
            </Button>
          </DialogClose>
          {!analysed && (
            <Button
              type="button"
              onClick={handleAnalyse}
              disabled={!text.trim() || isAnalysing}
              className="gap-2"
            >
              {isAnalysing && <Loader2 className="h-4 w-4 animate-spin" />}
              Phân tích
            </Button>
          )}
          {analysed && (
            <>
              <Button type="button" variant="outline" onClick={() => setAnalysed(null)}>
                Sửa lại
              </Button>
              <Button type="button" onClick={handleAddAll} disabled={analysed.matched.length === 0}>
                Thêm tất cả ({analysed.matched.length})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
