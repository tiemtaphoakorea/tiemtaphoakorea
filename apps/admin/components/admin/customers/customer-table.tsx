"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
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
import { Ban, Edit2, Key, MapPin, MoreHorizontal, Phone, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Active: {
    label: "Hoạt động",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  Inactive: {
    label: "Tạm khóa",
    color: "bg-slate-50 text-slate-600 border-slate-100",
  },
};

interface Customer {
  id: string;
  fullName: string;
  customerCode: string;
  customerType: "retail" | "wholesale";
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  orderCount: number;
  totalSpent: number;
  isActive: boolean;
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onResetPassword: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export function CustomerTable({
  customers,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: CustomerTableProps) {
  const router = useRouter();

  const handleRowClick = (customerId: string, e: React.MouseEvent<HTMLTableRowElement>) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return;
    }
    router.push(`/admin/customers/${customerId}`);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">Avatar</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Đơn hàng</TableHead>
            <TableHead>Tổng chi tiêu</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <TableRow
                key={customer.id}
                onClick={(e) => handleRowClick(customer.id, e)}
                className="group cursor-pointer transition-colors"
              >
                <TableCell className="py-4">
                  <div className="flex items-center justify-center">
                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
                      <AvatarImage src={customer.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {customer.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-900 dark:text-white">
                      {customer.fullName}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-tight text-slate-500 uppercase">
                      <Badge variant="outline" className="h-4 px-1 text-[8px] font-black uppercase">
                        {customer.customerType === "wholesale" ? "Sỉ" : "Lẻ"}
                      </Badge>
                      Mã: {customer.customerCode}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Phone className="h-3 w-3" />
                      {customer.phone || "Không có SĐT"}
                    </div>
                    <div className="flex max-w-[150px] items-center gap-2 truncate text-[10px] font-medium text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {customer.address || "Chưa cập nhật địa chỉ"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {customer.orderCount}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-black text-slate-900 dark:text-white">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${customer.isActive ? STATUS_CONFIG.Active.color : STATUS_CONFIG.Inactive.color} border text-[10px] font-black tracking-tight uppercase`}
                  >
                    {customer.isActive ? STATUS_CONFIG.Active.label : STATUS_CONFIG.Inactive.label}
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
                      <DropdownMenuItem asChild className="h-10 gap-2">
                        <Link href={`/admin/customers/${customer.id}`}>
                          <Users className="text-primary h-4 w-4" /> Xem chi tiết
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="h-10 gap-2" onClick={() => onEdit(customer)}>
                        <Edit2 className="h-4 w-4 text-blue-500" /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="h-10 gap-2"
                        onClick={() => onResetPassword(customer.id)}
                      >
                        <Key className="h-4 w-4 text-amber-500" /> Đổi mật khẩu
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        className="h-10 cursor-pointer gap-2"
                        onClick={() => onToggleStatus(customer.id, customer.isActive)}
                      >
                        <Ban />
                        {customer.isActive ? "Chặn" : "Mở chặn"} khách hàng
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
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">
                      Không tìm thấy khách hàng
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
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
