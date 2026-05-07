"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductWithVariants } from "@workspace/database/types/api";
import { Card } from "@workspace/ui/components/card";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Image as ImageIcon, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export type PickedVariant = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  price: string;
  costPrice: string | null;
  onHand: number;
  reserved: number;
  thumbnail: string | null;
};

type VariantRow = ProductWithVariants["variants"][number];

function flattenVariants(products: ProductWithVariants[]): PickedVariant[] {
  return products.flatMap((p) =>
    p.variants.map((v: VariantRow) => ({
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      variantName: v.name,
      sku: v.sku,
      price: v.price,
      costPrice: v.costPrice,
      onHand: v.onHand,
      reserved: v.reserved,
      thumbnail: v.images?.[0]?.imageUrl ?? p.thumbnail ?? null,
    })),
  );
}

function formatVnd(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("vi-VN");
}

export function VariantSearchPicker({
  selectedIds,
  onPick,
  emptyHint = "Nhập từ khoá để tìm sản phẩm",
}: {
  selectedIds: ReadonlyArray<string>;
  onPick: (variant: PickedVariant) => void;
  emptyHint?: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 250);

  const productsQuery = useQuery({
    queryKey: queryKeys.products.variants(debouncedQuery),
    queryFn: async () => {
      const res = await adminClient.getProductsWithVariants({
        search: debouncedQuery || undefined,
        limit: 50,
      });
      return res.products ?? [];
    },
    staleTime: 60_000,
  });

  const variants = flattenVariants(productsQuery.data ?? []);
  const selectedSet = new Set(selectedIds);

  return (
    <Card className="overflow-hidden border border-border p-0 shadow-none">
      {/* `shouldFilter={false}` — server already filters by search; keep cmdk
          from re-filtering and dropping rows when API returns scoped results. */}
      <Command shouldFilter={false} className="rounded-none bg-card">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Tìm theo tên, mã SKU..."
        />
        <CommandList className="max-h-80">
          {productsQuery.isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : variants.length === 0 ? (
            <CommandEmpty>{emptyHint}</CommandEmpty>
          ) : (
            variants.map((v) => {
              const picked = selectedSet.has(v.variantId);
              const sellable = Math.max(0, v.onHand - (v.reserved ?? 0));
              return (
                <CommandItem
                  key={v.variantId}
                  value={`${v.sku} ${v.productName} ${v.variantName}`}
                  disabled={picked}
                  onSelect={() => {
                    if (!picked) onPick(v);
                  }}
                  className="!gap-3 !rounded-md !px-3 !py-2.5 data-[disabled=true]:!bg-primary/5 data-[disabled=true]:!opacity-60"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted/30">
                    {v.thumbnail ? (
                      <Image
                        src={v.thumbnail}
                        alt={v.productName}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/40" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {v.productName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{v.sku}</span>
                      {v.variantName && (
                        <>
                          <span>·</span>
                          <span className="text-primary">{v.variantName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <div className="text-muted-foreground">
                      Giá nhập:{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatVnd(v.costPrice)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">
                      Tồn:{" "}
                      <span className="font-semibold text-foreground tabular-nums">{v.onHand}</span>{" "}
                      | Có thể bán:{" "}
                      <span
                        className={`font-semibold tabular-nums ${sellable > 0 ? "text-primary" : "text-red-500"}`}
                      >
                        {sellable}
                      </span>
                    </div>
                  </div>
                  {!picked && <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />}
                </CommandItem>
              );
            })
          )}
        </CommandList>
      </Command>
    </Card>
  );
}
