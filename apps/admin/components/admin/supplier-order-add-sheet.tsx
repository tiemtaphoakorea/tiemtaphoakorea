"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SupplierLookupItem } from "@repo/database/types/admin";
import { type SupplierOrderAddFormValues, supplierOrderAddSchema } from "@repo/shared/schemas";
import { cn } from "@repo/shared/utils";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { NumberInput } from "@repo/ui/components/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { Textarea } from "@repo/ui/components/textarea";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const EMPTY_PRODUCTS: any[] = [];
const EMPTY_SUPPLIERS: SupplierLookupItem[] = [];

interface SupplierOrderAddSheetProps {
  products: any[];
  suppliers: SupplierLookupItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrder?: (data: any) => void;
  isCreatingOrder?: boolean;
}

export function SupplierOrderAddSheet({
  products = EMPTY_PRODUCTS,
  suppliers = EMPTY_SUPPLIERS,
  isOpen,
  onOpenChange,
  onCreateOrder,
  isCreatingOrder = false,
}: SupplierOrderAddSheetProps) {
  "use no memo";
  const variants = products.flatMap((p) =>
    p.variants.map((v: any) => ({
      id: v.id,
      name: `${p.name} - ${v.name}`,
      sku: v.sku,
      price: v.price,
    })),
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SupplierOrderAddFormValues>({
    resolver: zodResolver(supplierOrderAddSchema),
    defaultValues: {
      variantId: "",
      supplierId: "",
      quantity: 1,
      expectedDate: "",
      note: "",
    },
  });

  const [variantOpen, setVariantOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const variantId = watch("variantId");
  const supplierId = watch("supplierId");
  const selectedVariant = variants.find((v) => v.id === variantId);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const onFormSubmit = (data: SupplierOrderAddFormValues) => {
    if (!onCreateOrder) return;
    onCreateOrder({
      variantId: data.variantId,
      supplierId: data.supplierId || undefined,
      quantity: String(data.quantity),
      expectedDate: data.expectedDate || undefined,
      note: data.note,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-10 sm:max-w-[540px]">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex h-full flex-col">
          <SheetHeader className="mb-8 p-0">
            <SheetTitle className="text-2xl font-black">Tạo đơn nhập hàng</SheetTitle>
            <SheetDescription className="font-medium text-slate-500">
              Tạo đơn đặt hàng mới từ nhà cung cấp để bổ sung tồn kho.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold tracking-wider text-slate-500 uppercase">
                Sản phẩm & Biến thể
              </Label>
              <Controller
                name="variantId"
                control={control}
                render={({ field }) => (
                  <Popover open={variantOpen} onOpenChange={setVariantOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={variantOpen}
                        aria-controls="variant-combobox-list"
                        className="h-12 w-full justify-between border-slate-200 font-medium"
                      >
                        {selectedVariant ? (
                          <span className="truncate">
                            {selectedVariant.name} ({selectedVariant.sku})
                          </span>
                        ) : (
                          <span className="text-slate-400">Chọn biến thể sản phẩm...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Tìm sản phẩm, SKU..."
                          className="h-12"
                          aria-label="Tìm sản phẩm, SKU"
                        />
                        <CommandList id="variant-combobox-list">
                          <CommandEmpty>Không tìm thấy sản phẩm nào.</CommandEmpty>
                          <CommandGroup>
                            {variants.map((variant) => (
                              <CommandItem
                                key={variant.id}
                                value={`${variant.name} ${variant.sku}`}
                                onSelect={() => field.onChange(variant.id)}
                                className="flex items-center justify-between py-3"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold">{variant.name}</span>
                                  <span className="font-mono text-xs text-slate-500">
                                    {variant.sku}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "h-4 w-4 transition-opacity",
                                    variantId === variant.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.variantId && (
                <p className="text-destructive text-sm">{errors.variantId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold tracking-wider text-slate-500 uppercase">
                Nhà cung cấp
              </Label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={supplierOpen}
                        aria-controls="supplier-combobox-list"
                        className="h-12 w-full justify-between border-slate-200 font-medium"
                      >
                        {selectedSupplier ? (
                          <span className="truncate">
                            {selectedSupplier.name} ({selectedSupplier.code})
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Chọn nhà cung cấp (không bắt buộc)...
                          </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Tìm nhà cung cấp..." className="h-12" />
                        <CommandList id="supplier-combobox-list">
                          <CommandEmpty>Không tìm thấy NCC nào.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => field.onChange("")}
                              className="flex items-center justify-between py-3"
                            >
                              <span className="font-medium text-slate-400">Không chọn</span>
                              <Check
                                className={cn(
                                  "h-4 w-4 transition-opacity",
                                  !supplierId ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </CommandItem>
                            {suppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.id}
                                value={`${supplier.name} ${supplier.code}`}
                                onSelect={() => field.onChange(supplier.id)}
                                className="flex items-center justify-between py-3"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold">{supplier.name}</span>
                                  <span className="font-mono text-xs text-slate-500">
                                    {supplier.code}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "h-4 w-4 transition-opacity",
                                    supplierId === supplier.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="quantity"
                  className="text-sm font-bold tracking-wider text-slate-500 uppercase"
                >
                  Số lượng nhập
                </Label>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="quantity"
                      decimalScale={0}
                      value={field.value}
                      onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                      className="h-12 border-slate-200 font-bold"
                      aria-invalid={!!errors.quantity}
                    />
                  )}
                />
                {errors.quantity && (
                  <p className="text-destructive text-sm">{errors.quantity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="expectedDate"
                  className="text-sm font-bold tracking-wider text-slate-500 uppercase"
                >
                  Ngày dự kiến về
                </Label>
                <Input
                  id="expectedDate"
                  type="date"
                  {...register("expectedDate")}
                  className="h-12 border-slate-200 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="note"
                className="text-sm font-bold tracking-wider text-slate-500 uppercase"
              >
                Ghi chú
              </Label>
              <Textarea
                id="note"
                {...register("note")}
                placeholder="Thông tin thêm về chuyến hàng, nhà cung cấp..."
                className="min-h-[120px] border-slate-200"
              />
            </div>
          </div>

          <SheetFooter className="mt-8 flex-row justify-end gap-3 border-t border-slate-100 p-0 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 px-8 font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isCreatingOrder || !variantId}
              className="shadow-primary/20 h-12 px-8 font-bold shadow-lg"
            >
              {isCreatingOrder ? "Đang xử lý..." : "Xác nhận tạo đơn"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
