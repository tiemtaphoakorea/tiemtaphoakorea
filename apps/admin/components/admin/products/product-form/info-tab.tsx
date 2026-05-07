"use client";

import type { ProductFormValues } from "@workspace/shared/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Controller, type UseFormReturn } from "react-hook-form";

interface InfoTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function InfoTab({ form }: InfoTabProps) {
  const errors = form.formState.errors;

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-semibold">Thông tin chung</CardTitle>
      </CardHeader>
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
            <p className="text-xs text-muted-foreground">Mặc định cho các biến thể tạo mới.</p>
          </Field>

          <Field>
            <FieldLabel>Mô tả sản phẩm</FieldLabel>
            <Textarea
              {...form.register("description")}
              placeholder="Thông tin chi tiết về sản phẩm..."
              className="min-h-35 resize-none"
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
