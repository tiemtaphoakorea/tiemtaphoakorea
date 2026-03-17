import { Eye, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/lib/utils";

interface CustomerOrderHistoryTableProps {
  orders: any[];
  formatDate: (date: any) => string;
}

export function CustomerOrderHistoryTable({ orders, formatDate }: CustomerOrderHistoryTableProps) {
  return (
    <Card className="h-full overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader className="border-b border-slate-100 bg-white px-8 py-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black tracking-tight uppercase">
              Lịch sử đơn hàng
            </CardTitle>
            <CardDescription className="font-medium">
              Danh sách các đơn hàng khách đã đặt tại shop.
            </CardDescription>
          </div>
          <ShoppingBag className="text-primary/20 h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="px-8 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Mã đơn
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Ngày đặt
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Trạng thái
                </TableHead>
                <TableHead className="px-8 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Tổng tiền
                </TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                  >
                    <TableCell className="px-8 py-4">
                      <Link
                        href={ADMIN_ROUTES.ORDER_DETAIL(order.id)}
                        className="text-primary font-black underline-offset-4 hover:underline"
                      >
                        #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-white text-[10px] font-black tracking-tight uppercase dark:bg-slate-950"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(Number(order.total))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/5 px-3 font-bold"
                        asChild
                      >
                        <Link href={ADMIN_ROUTES.ORDER_DETAIL(order.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900">
                        <ShoppingBag className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                        Chưa có đơn hàng nào
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
