import type { OrderItemTableItem } from "@repo/database/types/order";
import { formatCurrency } from "@repo/shared/utils";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";

interface OrderItemTableProps {
  items: OrderItemTableItem[];
  onUpdateQuantity: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
}

export function OrderItemTable({ items, onUpdateQuantity, onRemoveItem }: OrderItemTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50/50 hover:bg-transparent dark:bg-slate-900">
          <TableHead className="w-[40%] text-[10px] font-black uppercase">Sản phẩm</TableHead>
          <TableHead className="text-center text-[10px] font-black uppercase">Số lượng</TableHead>
          <TableHead className="text-right text-[10px] font-black uppercase">Đơn giá</TableHead>
          <TableHead className="text-right text-[10px] font-black uppercase">Thành tiền</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length > 0 ? (
          items.map((item) => (
            <TableRow key={item.variantId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Package className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold">{item.productName}</div>
                    <div className="text-xs text-slate-500">{item.variantName}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => onUpdateQuantity(item.variantId, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => onUpdateQuantity(item.variantId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {formatCurrency(item.price)}
              </TableCell>
              <TableCell className="text-right text-sm font-bold">
                {formatCurrency(item.price * item.quantity)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                  onClick={() => onRemoveItem(item.variantId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-48 text-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <ShoppingBag className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">Chưa có sản phẩm nào trong đơn hàng</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
