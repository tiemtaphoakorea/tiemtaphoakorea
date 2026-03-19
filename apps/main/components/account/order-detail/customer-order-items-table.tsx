import { formatCurrency, formatVariantDisplayName } from "@repo/shared/utils";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

interface CustomerOrderItemsTableProps {
  order: any;
}

export function CustomerOrderItemsTable({ order }: CustomerOrderItemsTableProps) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Sản phẩm</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Sản phẩm
              </TableHead>
              <TableHead className="text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                SL
              </TableHead>
              <TableHead className="text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Đơn giá
              </TableHead>
              <TableHead className="text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Thành tiền
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item: any) => (
              <TableRow key={item.id} className="hover:bg-transparent">
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {item.variant?.product?.images?.[0] || item.variant?.images?.[0] ? (
                        <Image
                          src={item.variant?.images?.[0]?.url || item.variant?.product?.images?.[0]}
                          alt={formatVariantDisplayName(item.productName)}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                        {formatVariantDisplayName(item.productName)}
                      </p>
                      <span className="text-xs font-medium text-slate-500">SKU: {item.sku}</span>
                      {item.variantName && item.variantName !== "Default" && (
                        <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">
                          {formatVariantDisplayName(item.variantName)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm font-bold">{item.quantity}</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatCurrency(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right text-sm font-bold">
                  {formatCurrency(item.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex w-full items-center justify-between text-sm">
          <span className="font-medium text-slate-500">Tạm tính</span>
          <span className="font-bold">{formatCurrency(order.subtotal)}</span>
        </div>
        <Separator />
        <div className="flex w-full items-center justify-between">
          <span className="text-base font-black tracking-tight text-slate-900 uppercase dark:text-white">
            Tổng thanh toán
          </span>
          <span className="text-primary text-xl font-black">{formatCurrency(order.total)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
