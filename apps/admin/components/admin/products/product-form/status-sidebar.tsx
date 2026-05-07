"use client";

import type { ProductFormValues } from "@workspace/shared/schemas";
import type { ProductFormCategory } from "@workspace/shared/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Controller, type UseFormReturn } from "react-hook-form";
import { CategoryTreeSelector } from "@/components/admin/products/category-tree-selector";

interface StatusSidebarProps {
  form: UseFormReturn<ProductFormValues>;
  categories: ProductFormCategory[];
}

export function StatusSidebar({ form, categories }: StatusSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">Phân loại</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
        </CardContent>
      </Card>
    </div>
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
        <Label className="cursor-pointer text-sm font-semibold">{label}</Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}
