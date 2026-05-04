"use client";

import type { ProductFormVariant } from "@workspace/shared/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { ImageUploader } from "@/components/image-uploader";
import type { FormAction } from "./form-state";

interface MediaTabProps {
  variants: ProductFormVariant[];
  selectedMediaVariantId: string;
  dispatch: React.Dispatch<FormAction>;
}

export function MediaTab({ variants, selectedMediaVariantId, dispatch }: MediaTabProps) {
  const selected = variants.find((v) => v.id === selectedMediaVariantId) || null;

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-semibold">Hình ảnh sản phẩm</CardTitle>
        <p className="text-xs text-muted-foreground">
          {selected ? `Chỉnh sửa hình ảnh cho biến thể: ${selected.name}` : "Chưa có biến thể nào"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {variants.length > 0 ? (
          <>
            <Field className="max-w-sm">
              <FieldLabel>Chọn biến thể</FieldLabel>
              <Select
                value={selectedMediaVariantId}
                onValueChange={(value) =>
                  dispatch({ type: "SET_SELECTED_MEDIA_VARIANT", payload: value })
                }
                className="w-full"
                placeholder="Chọn biến thể"
              >
                {variants.map((variant) => (
                  <SelectOption key={variant.id} value={variant.id}>
                    {variant.name}
                  </SelectOption>
                ))}
              </Select>
            </Field>
            <ImageUploader
              value={selected?.images ?? []}
              onChange={(urls) => {
                dispatch({
                  type: "SET_VARIANTS",
                  payload: variants.map((variant) =>
                    variant.id === selectedMediaVariantId ? { ...variant, images: urls } : variant,
                  ),
                });
              }}
              maxFiles={10}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Thêm biến thể để upload ảnh.</p>
        )}
      </CardContent>
    </Card>
  );
}
