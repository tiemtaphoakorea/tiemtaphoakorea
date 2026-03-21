import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Calendar, CalendarDays, MoreHorizontal, Truck } from "lucide-react";

interface SupplierOrderTableProps {
  orders: any[];
  statusConfig: Record<string, { label: string; color: string; icon: any }>;
  formatDate: (date: any) => string;
  onOpenUpdateDialog: (order: any) => void;
}

export function SupplierOrderTable({
  orders,
  statusConfig,
  formatDate,
  onOpenUpdateDialog,
}: SupplierOrderTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã đơn gốc</TableHead>
            <TableHead>Sản phẩm</TableHead>
            <TableHead>SL</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày đặt</TableHead>
            <TableHead>Ngày về (Dự kiến)</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => {
              const config = statusConfig[order.status || "pending"] || statusConfig.pending;
              return (
                <TableRow
                  key={order.id}
                  className="group transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-slate-900 dark:text-white">
                        #{order.order.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                        {order.order.customerName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {order.item.productName}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 bg-slate-50 px-1.5 text-[10px]">
                          {order.item.variantName}
                        </Badge>
                        <span className="font-mono text-xs text-slate-500">{order.item.sku}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{order.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${config.color} border text-[10px] font-black tracking-tight uppercase`}
                    >
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {order.orderedAt ? (
                        <>
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(order.orderedAt)}
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {order.expectedDate ? (
                        <>
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.expectedDate)}
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 rounded-lg p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 font-bold">
                        <DropdownMenuItem onClick={() => onOpenUpdateDialog(order)}>
                          Cập nhật trạng thái
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900">
                    <Truck className="h-8 w-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">
                      Không có đơn đặt hàng nào
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      Các đơn hàng Pre-order sẽ xuất hiện tại đây.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
