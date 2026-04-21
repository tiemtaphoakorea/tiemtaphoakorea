"use client";

import type { OrderBuilderItem } from "@workspace/database/types/order";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
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
      <div className="flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center animate-in fade-in-50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Chưa có sản phẩm nào</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Vui lòng thêm sản phẩm vào đơn hàng từ danh sách bên phải hoặc nút "Thêm sản phẩm".
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Sản phẩm</TableHead>
            <TableHead className="text-right">Đơn giá</TableHead>
            <TableHead className="text-center w-[80px]">Có thể bán</TableHead>
            <TableHead className="text-center w-[150px]">Số lượng</TableHead>
            <TableHead className="text-right">Thành tiền</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.variantId}>
              <TableCell>
                <div className="flex w-48 flex-col">
                  <span className="truncate font-medium" title={item.productName}>{item.productName}</span>
                  <span className="truncate text-xs text-muted-foreground" title={`${item.variantName} - ${item.sku}`}>
                    {item.variantName} - {item.sku}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Input
                  className="h-8 w-28 text-right ml-auto"
                  type="number"
                  min={0}
                  value={item.customPrice ?? item.price}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isNaN(val) && val >= 0) {
                      onUpdatePrice(item.variantId, val);
                    }
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
                    <Input
                      className="h-8 w-16 text-center"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!Number.isNaN(val) && val > 0) {
                          onUpdateQuantity(item.variantId, val);
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
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      Sắp thiếu hàng, cần nhập thêm {item.quantity - Math.max(0, item.available)}{" "}
                      cái
                    </div>
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
