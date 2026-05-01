import type { Supplier, SupplierStats } from "@workspace/database/types/admin";
import { formatCurrency, formatDateShort } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  TrendingUp,
} from "lucide-react";

interface SupplierDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  stats: SupplierStats | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Chờ đặt",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  ordered: {
    label: "Đã đặt",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  received: {
    label: "Đã nhận",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-600 border-red-100",
  },
};

export function SupplierDetailSheet({
  isOpen,
  onOpenChange,
  supplier,
  stats,
}: SupplierDetailSheetProps) {
  if (!supplier) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-2xl font-black">{supplier.name}</SheetTitle>
            <Badge variant="outline" className="font-black">
              {supplier.code}
            </Badge>
            <Badge
              className={`${supplier.isActive ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-slate-100 bg-slate-50 text-slate-600"} border text-[10px] font-bold`}
            >
              {supplier.isActive ? "Hoạt động" : "Ngừng hợp tác"}
            </Badge>
          </div>
          <SheetDescription className="font-medium text-slate-500">
            Chi tiết thông tin và lịch sử giao dịch với nhà cung cấp.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Thông tin liên hệ
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{supplier.phone || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate font-medium">{supplier.email || "Chưa cập nhật"}</span>
              </div>
              <div className="col-span-2 flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="font-medium">{supplier.address || "Chưa cập nhật"}</span>
              </div>
              <div className="col-span-2 flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="font-medium">
                  {supplier.paymentTerms || "Chưa thiết lập điều khoản"}
                </span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="space-y-3">
              <h3 className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Thống kê giao dịch
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      <Package className="h-3 w-3" /> Tổng đơn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-black">{stats.totalOrders}</div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                      <Clock className="h-3 w-3" /> Đang chờ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-black text-amber-600">
                      {stats.pendingOrders + stats.orderedOrders}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
                      <CheckCircle className="h-3 w-3" /> Đã nhận
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-black text-emerald-600">
                      {stats.receivedOrders}
                    </div>
                  </CardContent>
                </Card>

                <Card className="ring-primary/10 bg-primary/5 border-none shadow-sm ring-1">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-primary flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
                      <TrendingUp className="h-3 w-3" /> Tổng chi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-primary text-lg font-black">
                      {formatCurrency(stats.totalCost)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {stats && stats.recentOrders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Đơn hàng gần đây
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>SL</TableHead>
                      <TableHead>Giá nhập</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm font-medium">
                          {formatDateShort(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-bold">{order.quantity}</TableCell>
                        <TableCell className="text-sm font-bold">
                          {order.actualCostPrice
                            ? formatCurrency(Number(order.actualCostPrice))
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${STATUS_CONFIG[order.status || "pending"]?.color || ""} border text-[10px] font-bold`}
                          >
                            {STATUS_CONFIG[order.status || "pending"]?.label || order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Notes */}
          {supplier.note && (
            <div className="space-y-3">
              <h3 className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Ghi chú
              </h3>
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{supplier.note}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
