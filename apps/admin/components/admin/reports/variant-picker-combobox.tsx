"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox";
import { useEffect, useState } from "react";
import { inventoryReportsClient, type VariantSearchRow } from "@/services/reports-inventory.client";

interface VariantPickerComboboxProps {
  value: string | null;
  onChange: (variantId: string | null, variant: VariantSearchRow | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Searchable variant picker for the Ledger report (5.2).
 * Wraps the Combobox primitive with product/variant search via
 * GET /api/admin/reports/inventory/current-stock?view=variants&search=...
 */
export function VariantPickerCombobox({
  value,
  onChange,
  placeholder = "Tìm SKU hoặc tên sản phẩm...",
  className,
}: VariantPickerComboboxProps) {
  const [inputValue, setInputValue] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["variant-search", inputValue],
    queryFn: () => inventoryReportsClient.searchVariants(inputValue),
    enabled: inputValue.length >= 1,
    staleTime: 30_000,
  });

  const variants = data?.data ?? [];

  // When value is cleared externally, reset input
  useEffect(() => {
    if (!value) setInputValue("");
  }, [value]);

  function handleValueChange(newValue: string | null) {
    if (!newValue) {
      onChange(null, null);
      return;
    }
    const found = variants.find((v) => v.id === newValue) ?? null;
    onChange(newValue, found);
    if (found) {
      setInputValue(`${found.sku} — ${found.productName}`);
    }
  }

  return (
    <Combobox value={value} onValueChange={handleValueChange}>
      <ComboboxInput
        className={className}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        showClear={!!value}
        showTrigger={false}
      />
      <ComboboxContent className="z-50">
        <ComboboxList>
          {isLoading && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">Đang tìm...</div>
          )}
          {!isLoading && inputValue.length >= 1 && (
            <ComboboxEmpty>Không tìm thấy biến thể</ComboboxEmpty>
          )}
          {!isLoading &&
            variants.map((v) => (
              <ComboboxItem key={v.id} value={v.id}>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {v.sku}
                </span>
                <span className="truncate">
                  {v.productName}
                  {v.variantName !== v.productName && (
                    <span className="text-muted-foreground"> — {v.variantName}</span>
                  )}
                </span>
                <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                  Tồn: {v.onHand}
                </span>
              </ComboboxItem>
            ))}
          {!isLoading && inputValue.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Nhập SKU hoặc tên để tìm kiếm
            </div>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
