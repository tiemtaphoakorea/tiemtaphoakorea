import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@workspace/ui/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Eye, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface CustomerOrderHistoryTableProps {
  orders: any[];
  formatDate: (date: any) => string;
}

export function CustomerOrderHistoryTable({ orders, formatDate }: CustomerOrderHistoryTableProps) {
  return (
    <Card className="h-full overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
      <CardHeader className="border-b border-slate-100 bg-white px-8 py-6">
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
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="w-37"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow key={order.id} className="group transition-colors">
                    <TableCell className="py-4">
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
                        className="bg-white text-xs font-black tracking-tight uppercase"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-slate-900">
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
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="size-16 rounded-full bg-slate-50">
                          <ShoppingBag className="text-slate-200" />
                        </EmptyMedia>
                        <EmptyTitle className="text-xs font-black tracking-widest text-slate-400 uppercase">
                          Chưa có đơn hàng nào
                        </EmptyTitle>
                      </EmptyHeader>
                    </Empty>
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
