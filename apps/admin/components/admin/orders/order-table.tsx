import { ADMIN_ROUTES } from "@repo/shared/routes";
import { formatCurrency } from "@repo/shared/utils";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Eye, Smartphone } from "lucide-react";
import Link from "next/link";

interface OrderTableProps {
  orders: any[];
  statusConfig: Record<string, { label: string; color: string; icon: any }>;
  formatDate: (date: any) => string;
}

export function OrderTable({ orders, statusConfig, formatDate }: OrderTableProps) {
  return (
    <Table>
      <TableHeader className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <TableRow>
          <TableHead className="text-xs font-bold text-slate-500 uppercase">Mã đơn</TableHead>
          <TableHead className="text-xs font-bold text-slate-500 uppercase">Khách hàng</TableHead>
          <TableHead className="text-xs font-bold text-slate-500 uppercase">Trạng thái</TableHead>
          <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">
            Tổng tiền
          </TableHead>
          <TableHead className="text-center text-xs font-bold text-slate-500 uppercase">
            Ngày tạo
          </TableHead>
          <TableHead className="w-[140px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-slate-500">
              Không tìm thấy đơn hàng nào.
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon;
            return (
              <TableRow
                key={order.id}
                className="border-slate-100 hover:bg-slate-50/50 dark:border-slate-800"
              >
                <TableCell className="hover:border-l-primary border-l-4 border-l-transparent font-black text-slate-900 transition-all">
                  #{order.orderNumber}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {order.customerName || order.customer?.fullName}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Smartphone className="h-3 w-3" />{" "}
                      {order.customerPhone || order.customer?.phone || "---"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      statusConfig[order.status]?.color
                    } pointer-events-none flex w-fit items-center gap-1 border px-2 py-0.5 text-[10px] font-black tracking-tight uppercase shadow-none select-none`}
                  >
                    {StatusIcon && <StatusIcon className="h-3 w-3" />}
                    {statusConfig[order.status]?.label || order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-black text-slate-900 dark:text-white">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-center font-mono text-sm font-medium text-slate-500">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/5 gap-2 px-3 font-bold"
                    asChild
                  >
                    <Link href={ADMIN_ROUTES.ORDER_DETAIL(order.id)}>
                      <Eye className="h-4 w-4" />
                      <span>Xem chi tiết</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
