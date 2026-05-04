"use client";

import type { ProductFormValues } from "@workspace/shared/schemas";
import type { ProductFormCategory } from "@workspace/shared/types/product";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { Controller, type UseFormReturn } from "react-hook-form";
import { CategoryTreeSelector } from "@/components/admin/products/category-tree-selector";

interface InfoTabProps {
  form: UseFormReturn<ProductFormValues>;
  categories: ProductFormCategory[];
}

export function InfoTab({ form, categories }: InfoTabProps) {
  const errors = form.formState.errors;

  return (
    <Card className="shadow-none">
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel required>Tên sản phẩm</FieldLabel>
            <Input
              {...form.register("name")}
              placeholder="Ví dụ: Áo Thun Premium Cotton"
              aria-invalid={!!errors.name}
              required
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Danh mục</FieldLabel>
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field }) => (
                  <CategoryTreeSelector
                    categories={categories}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Giá niêm yết (Base Price)</FieldLabel>
              <Controller
                name="basePrice"
                control={form.control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    value={field.value}
                    onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                    className="font-mono tabular-nums"
                    aria-invalid={!!errors.basePrice}
                  />
                )}
              />
              {errors.basePrice && (
                <p className="text-xs text-destructive">{errors.basePrice.message}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Mặc định cho các biến thể tạo mới.
              </p>
            </Field>
          </div>

          <Field>
            <FieldLabel>Mô tả sản phẩm</FieldLabel>
            <Textarea
              {...form.register("description")}
              placeholder="Thông tin chi tiết về sản phẩm..."
              className="min-h-[140px] resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SwitchRow
              control={form.control}
              name="isActive"
              label="Hiển thị sản phẩm"
              description="Cho phép sản phẩm xuất hiện trên storefront"
            />
            <SwitchRow
              control={form.control}
              name="isFeatured"
              label="Bán chạy / Nổi bật"
              description='Hiển thị trong mục "Bán chạy" trên trang chủ'
              tone="amber"
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

interface SwitchRowProps {
  control: UseFormReturn<ProductFormValues>["control"];
  name: "isActive" | "isFeatured";
  label: string;
  description: string;
  tone?: "default" | "amber";
}

function SwitchRow({ control, name, label, description, tone = "default" }: SwitchRowProps) {
  const toneClass =
    tone === "amber" ? "border-amber-200/70 bg-amber-50/40" : "border-border bg-card";
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${toneClass}`}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
        )}
      />
      <div className="flex flex-col leading-tight">
        <Label className="cursor-pointer text-[13px] font-semibold">{label}</Label>
        <span className="text-[11px] text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}
