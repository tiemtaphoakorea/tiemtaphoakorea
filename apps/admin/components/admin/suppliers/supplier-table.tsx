import type { Supplier } from "@workspace/database/types/admin";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import {
  Edit2,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Active: {
    label: "Hoạt động",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  Inactive: {
    label: "Ngừng hợp tác",
    color: "bg-slate-50 text-slate-600 border-slate-100",
  },
};

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onViewDetail: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

export function SupplierTable({ suppliers, onEdit, onViewDetail, onDelete }: SupplierTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã NCC</TableHead>
            <TableHead>Nhà cung cấp</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Điều khoản thanh toán</TableHead>
            <TableHead>Số đơn hàng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <TableRow
                key={supplier.id}
                className="group transition-colors"
              >
                <TableCell className="py-4">
                  <Badge variant="outline" className="text-xs font-black uppercase">
                    {supplier.code}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-900 dark:text-white">
                      {supplier.name}
                    </span>
                    {supplier.address && (
                      <span className="flex max-w-[200px] items-center gap-1 truncate text-[10px] font-medium text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {supplier.address}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex max-w-[180px] items-center gap-2 truncate text-[10px] font-medium text-slate-400">
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </div>
                    )}
                    {!supplier.phone && !supplier.email && (
                      <span className="text-xs text-slate-400">Chưa cập nhật</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {supplier.paymentTerms || "Chưa cập nhật"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {supplier.totalOrders}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${supplier.isActive ? STATUS_CONFIG.Active.color : STATUS_CONFIG.Inactive.color} border text-[10px] font-black tracking-tight uppercase`}
                  >
                    {supplier.isActive ? STATUS_CONFIG.Active.label : STATUS_CONFIG.Inactive.label}
                  </Badge>
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
                      <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                      <DropdownMenuItem
                        className="h-10 gap-2"
                        onClick={() => onViewDetail(supplier)}
                      >
                        <Eye className="text-primary h-4 w-4" /> Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem className="h-10 gap-2" onClick={() => onEdit(supplier)}>
                        <Edit2 className="h-4 w-4 text-blue-500" /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        className="h-10 cursor-pointer gap-2"
                        onClick={() => onDelete(supplier.id)}
                      >
                        <Trash2 /> Xóa nhà cung cấp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900">
                    <Truck className="h-8 w-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">
                      Chưa có nhà cung cấp nào
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      Hãy thêm nhà cung cấp đầu tiên của bạn.
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
