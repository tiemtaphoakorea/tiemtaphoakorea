"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { adminClient } from "@/services/admin.client";

export function DashboardRecentOrders() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: () => adminClient.getRecentOrders(),
  });

  const recentOrders = data?.recentOrders;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Đang xử lý</Badge>;
      case "processing":
        return (
          <Badge variant="secondary" className="border-none bg-blue-500/10 text-blue-500">
            Đang chuẩn bị
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="secondary" className="border-none bg-amber-500/10 text-amber-500">
            Đang giao
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="secondary" className="border-none bg-emerald-500/10 text-emerald-500">
            Đã giao
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!recentOrders) return null;

  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="font-black">Đơn hàng vừa đặt</CardTitle>
          <p className="text-muted-foreground text-sm font-medium">Danh sách 5 đơn hàng mới nhất</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary gap-1 font-bold" asChild>
          <Link href={ADMIN_ROUTES.ORDERS}>
            Tất cả đơn hàng <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent dark:border-slate-800">
                <TableHead className="font-bold text-slate-900 dark:text-white">Mã đơn</TableHead>
                <TableHead className="font-bold text-slate-900 dark:text-white">
                  Khách hàng
                </TableHead>
                <TableHead className="text-right font-bold text-slate-900 dark:text-white">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-center font-bold text-slate-900 dark:text-white">
                  Trạng thái
                </TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id} className="border-slate-100 dark:border-slate-800">
                  <TableCell className="text-primary font-black">
                    <Link href={ADMIN_ROUTES.ORDER_DETAIL(order.id)}>{order.orderNumber}</Link>
                  </TableCell>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.total || 0)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/5 gap-2 px-3 font-bold"
                      asChild
                    >
                      <Link href={ADMIN_ROUTES.ORDER_DETAIL(order.id)}>
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-medium text-slate-500 italic">Chưa có đơn hàng nào trong hôm nay</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
