"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { OrderBuilderItem } from "@/types/order";

interface OrderItemsTableProps {
  items: OrderBuilderItem[];
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
}

export function OrderItemsTable({ items, onUpdateQuantity, onRemoveItem }: OrderItemsTableProps) {
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
          <TableRow className="bg-muted/50">
            <TableHead className="w-[35%]">Sản phẩm</TableHead>
            <TableHead className="text-right">Đơn giá</TableHead>
            <TableHead className="text-center w-[80px]">Tồn kho</TableHead>
            <TableHead className="text-center w-[150px]">Số lượng</TableHead>
            <TableHead className="text-right">Thành tiền</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.variantId}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.variantName} - {item.sku}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-center text-muted-foreground">{item.stock}</TableCell>
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
                  {item.quantity > item.stock && (
                    <span className="text-xs text-amber-600 font-medium">
                      Vượt tồn kho (tối đa {item.stock})
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.price * item.quantity)}
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
