"use client";

import { LOW_STOCK_DEFAULT_THRESHOLD } from "@workspace/shared/constants";
import type { ProductFormVariant } from "@workspace/shared/types/product";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { NumberInput } from "@workspace/ui/components/number-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";
import type { Attribute, FormAction } from "./form-state";

interface VariantsTabProps {
  attributes: Attribute[];
  variants: ProductFormVariant[];
  basePrice: number;
  dispatch: React.Dispatch<FormAction>;
  onGenerate: () => void;
}

export function VariantsTab({
  attributes,
  variants,
  basePrice,
  dispatch,
  onGenerate,
}: VariantsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <VariantGenerator attributes={attributes} dispatch={dispatch} onGenerate={onGenerate} />
      <VariantsTable variants={variants} basePrice={basePrice} dispatch={dispatch} />
    </div>
  );
}

interface VariantGeneratorProps {
  attributes: Attribute[];
  dispatch: React.Dispatch<FormAction>;
  onGenerate: () => void;
}

function VariantGenerator({ attributes, dispatch, onGenerate }: VariantGeneratorProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-primary/10">
            <Wand2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold">Bộ tạo biến thể tự động</span>
            <span className="text-[11px] text-muted-foreground">
              Nhập các thuộc tính để tạo nhanh biến thể
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Thuộc tính 1: {attributes[0].name}</FieldLabel>
            <Input
              placeholder="Ví dụ: Đỏ, Xanh..."
              onChange={(e) =>
                dispatch({ type: "UPDATE_ATTRIBUTE_VALUE", index: 0, valString: e.target.value })
              }
            />
          </Field>
          <Field>
            <FieldLabel>Thuộc tính 2: {attributes[1].name}</FieldLabel>
            <Input
              placeholder="Ví dụ: S, M..."
              onChange={(e) =>
                dispatch({ type: "UPDATE_ATTRIBUTE_VALUE", index: 1, valString: e.target.value })
              }
            />
          </Field>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onGenerate} className="w-full">
          <RefreshCw className="h-3.5 w-3.5" /> Tạo danh sách biến thể
        </Button>
      </CardContent>
    </Card>
  );
}

interface VariantsTableProps {
  variants: ProductFormVariant[];
  basePrice: number;
  dispatch: React.Dispatch<FormAction>;
}

function VariantsTable({ variants, basePrice, dispatch }: VariantsTableProps) {
  const handleAdd = () => {
    dispatch({
      type: "SET_VARIANTS",
      payload: [
        ...variants,
        {
          id: `temp-${Date.now()}`,
          name: "Mới",
          sku: "",
          price: basePrice,
          costPrice: 0,
          onHand: 0,
          lowStockThreshold: LOW_STOCK_DEFAULT_THRESHOLD,
          images: [],
        },
      ],
    });
  };

  return (
    <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Danh sách biến thể ({variants.length})
        </span>
        <Button type="button" variant="ghost" size="xs" onClick={handleAdd}>
          <Plus className="h-3 w-3" /> Thêm thủ công
        </Button>
      </div>
      <div className="max-h-[520px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {[
                { label: "", width: "w-[40px]" },
                { label: "Tên biến thể", width: "min-w-[150px]" },
                { label: "SKU", width: "min-w-[120px]" },
                { label: "Giá bán", width: "min-w-[110px]" },
                { label: "Giá vốn", width: "min-w-[110px]" },
                { label: "Tồn kho", width: "min-w-[90px]" },
                { label: "Ngưỡng cảnh báo", width: "min-w-[100px]" },
                { label: "", width: "w-[40px]" },
              ].map((h, i) => (
                <TableHead
                  key={i}
                  className={`px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${h.width}`}
                >
                  {h.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant, idx) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                idx={idx}
                variants={variants}
                dispatch={dispatch}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

interface VariantRowProps {
  variant: ProductFormVariant;
  idx: number;
  variants: ProductFormVariant[];
  dispatch: React.Dispatch<FormAction>;
}

function VariantRow({ variant, idx, variants, dispatch }: VariantRowProps) {
  const update = (patch: Partial<ProductFormVariant>) => {
    const next = [...variants];
    next[idx] = { ...next[idx], ...patch };
    dispatch({ type: "SET_VARIANTS", payload: next });
  };

  const cellInput =
    "h-8 border-transparent bg-transparent px-2 hover:border-border focus:border-border";

  return (
    <TableRow>
      <TableCell className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
        {idx + 1}
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <Input
          value={variant.name}
          onChange={(e) => update({ name: e.target.value })}
          className={`${cellInput} font-medium`}
        />
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <Input
          value={variant.sku}
          placeholder="SKU-..."
          onChange={(e) => update({ sku: e.target.value })}
          className={`${cellInput} font-mono`}
        />
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <NumberInput
          name={`variants.${idx}.price`}
          data-testid={`variant-price-${idx}`}
          aria-label="Giá bán biến thể"
          value={variant.price}
          onValueChange={(values) => update({ price: Math.max(0, values.floatValue ?? 0) })}
          className={`${cellInput} text-right font-mono tabular-nums`}
        />
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <NumberInput
          name={`variants.${idx}.costPrice`}
          data-testid={`variant-cost-${idx}`}
          aria-label="Giá vốn biến thể"
          value={variant.costPrice}
          onValueChange={(values) => update({ costPrice: Math.max(0, values.floatValue ?? 0) })}
          className={`${cellInput} text-right font-mono tabular-nums text-muted-foreground`}
        />
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <NumberInput
          name={`variants.${idx}.onHand`}
          data-testid={`variant-stock-${idx}`}
          aria-label="Tồn kho biến thể"
          decimalScale={0}
          value={variant.onHand}
          onValueChange={(values) => update({ onHand: Math.max(0, values.floatValue ?? 0) })}
          onBlur={(e) => {
            const raw = (e.target as HTMLInputElement).value ?? "";
            const normalized = raw.replace(/\./g, "").replace(",", ".");
            const parsed = Number.parseFloat(normalized) || 0;
            if (parsed < 0) update({ onHand: 0 });
          }}
          className={`${cellInput} text-center font-mono tabular-nums font-semibold`}
        />
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <NumberInput
          name={`variants.${idx}.lowStockThreshold`}
          data-testid={`variant-low-stock-threshold-${idx}`}
          aria-label="Ngưỡng cảnh báo tồn kho biến thể"
          decimalScale={0}
          value={variant.lowStockThreshold}
          onValueChange={(values) =>
            update({ lowStockThreshold: Math.max(0, values.floatValue ?? 0) })
          }
          className={`${cellInput} text-center font-mono tabular-nums`}
        />
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <Button
          type="button"
          size="icon-xs"
          variant="ghost-destructive"
          onClick={() =>
            dispatch({
              type: "SET_VARIANTS",
              payload: variants.filter((_, i) => i !== idx),
            })
          }
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
