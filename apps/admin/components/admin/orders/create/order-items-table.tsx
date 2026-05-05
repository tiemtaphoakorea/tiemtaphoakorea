"use client";

import type { OrderBuilderItem } from "@workspace/database/types/order";
import { formatCurrency } from "@workspace/shared/utils";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { NumberInput } from "@workspace/ui/components/number-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Minus, Plus, Trash2 } from "lucide-react";

interface OrderItemsTableProps {
  items: OrderBuilderItem[];
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onUpdatePrice: (variantId: string, price: number) => void;
  onRemoveItem: (variantId: string) => void;
}

export function OrderItemsTable({
  items,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
}: OrderItemsTableProps) {
  if (items.length === 0) {
    return (
      <Empty bordered className="min-h-37 animate-in fade-in-50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Plus />
          </EmptyMedia>
          <EmptyTitle>Chưa có sản phẩm nào</EmptyTitle>
          <EmptyDescription>
            Vui lòng thêm sản phẩm vào đơn hàng từ danh sách bên phải hoặc nút "Thêm sản phẩm".
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-45">Sản phẩm</TableHead>
            <TableHead className="w-32 text-right">Đơn giá</TableHead>
            <TableHead className="w-17 text-center">Tồn kho</TableHead>
            <TableHead className="w-40 text-center">Số lượng</TableHead>
            <TableHead className="w-27 text-right">Thành tiền</TableHead>
            <TableHead className="w-11.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.variantId}>
              <TableCell className="max-w-55">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium" title={item.productName}>
                    {item.productName}
                  </span>
                  <span
                    className="truncate text-xs text-muted-foreground"
                    title={`${item.variantName} - ${item.sku}`}
                  >
                    {item.variantName} - {item.sku}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <NumberInput
                  className="h-8 w-28 text-right ml-auto"
                  decimalScale={0}
                  value={item.customPrice ?? item.price}
                  onValueChange={({ floatValue }) => {
                    if (floatValue !== undefined) onUpdatePrice(item.variantId, floatValue);
                  }}
                />
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {Math.max(0, item.available)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <NumberInput
                      className="h-8 w-16 text-center"
                      decimalScale={0}
                      min={1}
                      value={item.quantity}
                      onValueChange={({ floatValue }) => {
                        if (floatValue !== undefined && floatValue > 0) {
                          onUpdateQuantity(item.variantId, floatValue);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {item.quantity > item.available && (
                    <Alert variant="warning" className="px-2 py-1 text-xs">
                      <AlertDescription className="text-warning">
                        Sắp thiếu hàng, cần nhập thêm {item.quantity - Math.max(0, item.available)}{" "}
                        cái
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency((item.customPrice ?? item.price) * item.quantity)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                  onClick={() => onRemoveItem(item.variantId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
