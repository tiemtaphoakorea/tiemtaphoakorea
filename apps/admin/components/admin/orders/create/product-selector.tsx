"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductWithVariants } from "@workspace/database/types/api";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

interface ProductSelectorProps {
  onSelectVariant: (
    variant: ProductWithVariants["variants"][number],
    product: ProductWithVariants,
  ) => void;
}

export function ProductSelector({ onSelectVariant }: ProductSelectorProps) {
  // Product Search State
  const [openProduct, setOpenProduct] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductWithVariants | null>(null);

  // Variant Selection State
  const [selectedVariantId, setSelectedVariantId] = React.useState<string>("");
  const [openVariant, setOpenVariant] = React.useState(false);

  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  // Fetch Products
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.variants(debouncedSearch),
    queryFn: () => adminClient.getProductsWithVariants(),
  });

  // Filter products client-side for now (as per existing logic)
  const products = React.useMemo(() => {
    if (!data?.products) return [];
    if (!debouncedSearch) return data.products;

    const lower = debouncedSearch.toLowerCase();
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(lower)),
    );
  }, [data, debouncedSearch]);

  const handleProductSelect = (product: ProductWithVariants) => {
    setSelectedProduct(product);
    setOpenProduct(false);
    setSearchQuery(""); // Optional: keep query or clear? Clearing feels cleaner.
    setSelectedVariantId(""); // Reset variant
  };

  const handleVariantAdd = () => {
    if (!selectedProduct || !selectedVariantId) return;

    const variant = selectedProduct.variants.find((v) => v.id === selectedVariantId);
    if (variant) {
      onSelectVariant(variant, selectedProduct);
      // Reset after adding
      setSelectedProduct(null);
      setSelectedVariantId("");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-sm">Thêm sản phẩm</h3>
        <p className="text-xs text-muted-foreground">
          Tìm sản phẩm và chọn phân loại để thêm vào đơn.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_auto]">
        {/* Step 1: Select Product — min-w-0 + shrink so long names ellipsis instead of growing the grid */}
        <div className="flex min-w-0 flex-col gap-2">
          <Popover open={openProduct} onOpenChange={setOpenProduct}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openProduct}
                aria-controls="product-combobox-list"
                className="min-w-0 shrink justify-between gap-2 overflow-hidden w-full"
              >
                {selectedProduct ? (
                  <span className="min-w-0 flex-1 truncate text-left font-medium">
                    {selectedProduct.name}
                  </span>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">
                    Chọn sản phẩm gốc...
                  </span>
                )}
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] p-0 sm:w-75" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Tìm tên hoặc SKU..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList id="product-combobox-list">
                  {isLoading && (
                    <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm...
                    </div>
                  )}
                  {!isLoading && products.length === 0 && (
                    <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                  )}
                  <CommandGroup>
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.id}
                        onSelect={() => handleProductSelect(product)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProduct?.id === product.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex items-center gap-2 overflow-hidden w-full">
                          {(() => {
                            // Try to find an image from variants since 'thumbnail' might not be on the raw product object
                            const image =
                              product.thumbnail ||
                              product.variants?.find((v) => v.images?.length > 0)?.images[0]
                                ?.imageUrl;

                            if (image) {
                              return (
                                <Image
                                  src={image}
                                  alt={product.name ?? "Product image"}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 rounded-md object-contain border bg-muted"
                                  sizes="32px"
                                  unoptimized
                                />
                              );
                            }
                            return null;
                          })()}
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate font-medium">{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {product.variants.length} phân loại
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Step 2: Select Variant */}
        <div className="flex min-w-0 flex-col gap-2">
          <Popover open={openVariant} onOpenChange={(o) => selectedProduct && setOpenVariant(o)}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openVariant}
                aria-controls="variant-combobox-list"
                disabled={!selectedProduct}
                className="min-w-0 shrink justify-between gap-2 overflow-hidden w-full"
              >
                {selectedVariant ? (
                  <span className="min-w-0 flex-1 truncate text-left font-medium">
                    {selectedVariant.name || "Default"}
                  </span>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">
                    Chọn phân loại / Biến thể...
                  </span>
                )}
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] p-0 sm:w-75" align="start">
              <Command>
                <CommandInput placeholder="Tìm phân loại hoặc SKU..." />
                <CommandList id="variant-combobox-list">
                  <CommandEmpty>Không có phân loại.</CommandEmpty>
                  <CommandGroup>
                    {selectedProduct?.variants.map((variant) => {
                      const available = variant.onHand - variant.reserved;
                      return (
                        <CommandItem
                          key={variant.id}
                          value={`${variant.name ?? "Default"} ${variant.sku}`}
                          onSelect={() => {
                            setSelectedVariantId(variant.id);
                            setOpenVariant(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedVariantId === variant.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex min-w-0 flex-col overflow-hidden flex-1">
                            <span className="truncate font-medium">
                              {variant.name || "Default"}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {variant.sku} ·{" "}
                              <span
                                className={available > 0 ? "text-green-600" : "text-orange-600"}
                              >
                                {available > 0 ? `Còn ${available}` : "Hết hàng"}
                              </span>{" "}
                              · {formatCurrency(Number(variant.price))}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Step 3: Add Button */}
        <div>
          <Button
            onClick={handleVariantAdd}
            disabled={!selectedProduct || !selectedVariantId}
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm
          </Button>
        </div>
      </div>
    </div>
  );
}
