"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SupplierLookupItem } from "@workspace/database/types/admin";
import { type SupplierOrderAddFormValues, supplierOrderAddSchema } from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

const EMPTY_PRODUCTS: any[] = [];
const EMPTY_SUPPLIERS: SupplierLookupItem[] = [];

interface InventoryAddSheetProps {
  products: any[];
  suppliers: SupplierLookupItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrder?: (data: any) => void;
  isCreatingOrder?: boolean;
}

export function InventoryAddSheet({
  products = EMPTY_PRODUCTS,
  suppliers = EMPTY_SUPPLIERS,
  isOpen,
  onOpenChange,
  onCreateOrder,
  isCreatingOrder = false,
}: InventoryAddSheetProps) {
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

  const variantId = useWatch({ control, name: "variantId" });
  const supplierId = useWatch({ control, name: "supplierId" });
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
      <SheetContent className="overflow-y-auto p-6 sm:max-w-[540px] sm:p-10">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex h-full flex-col">
          <SheetHeader className="mb-8 p-0">
            <SheetTitle className="text-2xl font-black">Tạo đơn nhập hàng</SheetTitle>
            <SheetDescription className="font-medium text-slate-500">
              Tạo đơn đặt hàng mới từ nhà cung cấp để bổ sung tồn kho.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1">
            <FieldGroup>
              <Field>
                <FieldLabel>Sản phẩm & Biến thể</FieldLabel>
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
                  <p className="text-sm text-destructive">{errors.variantId.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel>Nhà cung cấp</FieldLabel>
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
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="quantity">Số lượng nhập</FieldLabel>
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        id="quantity"
                        decimalScale={0}
                        value={field.value}
                        onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                        aria-invalid={!!errors.quantity}
                      />
                    )}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="expectedDate">Ngày dự kiến về</FieldLabel>
                  <Input id="expectedDate" type="date" {...register("expectedDate")} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="note">Ghi chú</FieldLabel>
                <Textarea
                  id="note"
                  {...register("note")}
                  placeholder="Thông tin thêm về chuyến hàng, nhà cung cấp..."
                  className="min-h-[120px] border-slate-200"
                />
              </Field>
            </FieldGroup>
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
              className="h-12 px-8 font-bold shadow-lg shadow-primary/20"
            >
              {isCreatingOrder ? "Đang xử lý..." : "Xác nhận tạo đơn"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
