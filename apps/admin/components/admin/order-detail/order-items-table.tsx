import { formatCurrency, formatVariantDisplayName } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Package, ShoppingBag } from "lucide-react";
import Image from "next/image";

interface OrderItemsTableProps {
  items: any[];
  subtotal: number;
  total: number;
}

export function OrderItemsTable({ items, subtotal, total }: OrderItemsTableProps) {
  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
          <Package className="text-primary h-5 w-5" /> Chi tiết sản phẩm
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Sản phẩm</TableHead>
                <TableHead className="text-center">SL</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Tổng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="overflow-hidden">
                    <div className="flex min-w-0 items-center gap-3">
                      {item.variant.images[0] ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image
                            src={item.variant.images[0].imageUrl}
                            alt={formatVariantDisplayName(item.productName)}
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                          <ShoppingBag className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                      <div className="min-w-0 max-w-[180px]">
                        <div
                          className="truncate text-sm font-bold text-slate-900"
                          title={formatVariantDisplayName(item.productName)}
                        >
                          {formatVariantDisplayName(item.productName)}
                        </div>
                        <div
                          className="truncate font-mono text-xs text-slate-500"
                          title={formatVariantDisplayName(item.variantName)}
                        >
                          {formatVariantDisplayName(item.variantName)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium text-slate-600">
                    {formatCurrency(Number(item.unitPrice))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {formatCurrency(Number(item.lineTotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col items-end gap-2 border-t border-slate-100 bg-slate-50/50 p-6">
          <div className="flex w-full max-w-xs justify-between text-sm font-medium text-slate-500">
            <span>Tạm tính</span>
            <span>{formatCurrency(Number(subtotal))}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-xl font-black text-slate-900">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatCurrency(Number(total))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
