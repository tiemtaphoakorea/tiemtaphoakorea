"use client";

import type { ProductWithVariants } from "@repo/database/types/api";
import { cn, formatCurrency } from "@repo/shared/utils";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useDebounce } from "use-debounce";
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

  // Fetch Products
  const { data, isLoading } = useQuery({
    queryKey: ["products", "variants", debouncedSearch],
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

  const _selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-sm">Thêm sản phẩm</h3>
        <p className="text-xs text-muted-foreground">
          Tìm sản phẩm và chọn phân loại để thêm vào đơn.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.5fr_1.5fr_auto]">
        {/* Step 1: Select Product */}
        <div className="flex flex-col gap-2">
          <Popover open={openProduct} onOpenChange={setOpenProduct}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openProduct}
                aria-controls="product-combobox-list"
                className="justify-between w-full"
              >
                {selectedProduct ? (
                  <span className="truncate font-medium">{selectedProduct.name}</span>
                ) : (
                  <span className="text-muted-foreground">Chọn sản phẩm gốc...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
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
                                  className="h-8 w-8 rounded-md object-cover border bg-muted"
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
          {selectedProduct && (
            <Button
              variant="ghost"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-red-500 self-start"
              onClick={() => {
                setSelectedProduct(null);
                setSelectedVariantId("");
              }}
            >
              <X className="h-3 w-3 mr-1" /> Bỏ chọn
            </Button>
          )}
        </div>

        {/* Step 2: Select Variant */}
        <div className="flex flex-col gap-2">
          <Select
            value={selectedVariantId}
            onValueChange={setSelectedVariantId}
            disabled={!selectedProduct}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn phân loại / Biến thể..." />
            </SelectTrigger>
            <SelectContent>
              {selectedProduct?.variants.map((variant) => {
                const stock = Number(variant.stockQuantity || 0);
                const isOutOfStock = stock <= 0;

                return (
                  <SelectItem
                    key={variant.id}
                    value={variant.id}
                    disabled={isOutOfStock} // Optionally disable out of stock
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{variant.name || "Default"}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{variant.sku}</span>
                        <span>|</span>
                        <span className={stock > 0 ? "text-green-600" : "text-orange-600"}>
                          {stock > 0 ? `Tồn: ${stock}` : "Hết hàng"}
                        </span>
                        <span>|</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(Number(variant.price))}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
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
