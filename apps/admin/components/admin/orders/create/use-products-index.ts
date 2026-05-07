"use client";

import { useQuery } from "@tanstack/react-query";
import type { OrderProductSelection, OrderProductVariant } from "@workspace/database/types/order";
import * as React from "react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export interface FlatVariantRow {
  variant: OrderProductVariant;
  product: OrderProductSelection;
}

const SEARCH_LIMIT = 30;

// Server-side search hook for the order add-row dropdown.
// Empty query → returns recent in-stock variants (up to SEARCH_LIMIT).
// Non-empty query → server filters by product name / variant SKU / variant name.
export function useVariantSearch(search: string): {
  rows: FlatVariantRow[];
  isLoading: boolean;
} {
  const trimmed = search.trim();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.variants(trimmed),
    queryFn: () =>
      adminClient.getProductsWithVariants({
        search: trimmed || undefined,
        limit: SEARCH_LIMIT,
        inStockOnly: true,
      }),
  });

  const rows = React.useMemo<FlatVariantRow[]>(() => {
    if (!data?.products) return [];
    const flat: FlatVariantRow[] = [];
    for (const product of data.products as OrderProductSelection[]) {
      for (const variant of product.variants) {
        flat.push({ product, variant });
      }
    }
    return flat;
  }, [data]);

  return { rows, isLoading };
}
