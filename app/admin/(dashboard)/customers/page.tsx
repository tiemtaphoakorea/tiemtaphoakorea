"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Edit2,
  Filter,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CustomerAddSheet } from "@/components/admin/customers/customer-add-sheet";
import { CustomerEditSheet } from "@/components/admin/customers/customer-edit-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PAGINATION_DEFAULT } from "@/lib/pagination";
import { formatCurrency } from "@/lib/utils";
import { adminClient } from "@/services/admin.client";
import type { CustomerStatsItem } from "@/types/admin";

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

export default function AdminCustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchTerm = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "All";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || PAGINATION_DEFAULT.LIMIT.toString(), 10),
  );

  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", searchTerm, statusFilter, page, limit],
    queryFn: () =>
      adminClient.getCustomers({
        search: searchTerm,
        status: statusFilter !== "All" ? statusFilter : undefined,
        page,
        limit,
      }),
    placeholderData: keepPreviousData,
  });

  const customers = data?.data || [];
  const metadata = data?.metadata;

  const updateParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    // Reset to page 1 if filters change
    if (
      (newParams.search !== undefined || newParams.status !== undefined) &&
      newParams.page === undefined
    ) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (val: string) => {
    updateParams({ search: val });
  };

  const handleStatusFilterChange = (val: string) => {
    updateParams({ status: val });
  };

  const handleAddCustomer = async (formData: FormData) => {
    setIsLoadingAction(true);
    try {
      const res = await adminClient.createCustomer({
        fullName: (formData.get("fullName") as string) ?? "",
        phone: (formData.get("phone") as string) ?? undefined,
        address: (formData.get("address") as string) ?? undefined,
        customerType: (formData.get("customerType") as string) ?? "retail",
      });
      toast({ title: "Thành công", description: "Đã tạo khách hàng mới" });
      setIsAddSheetOpen(false);
      setShowCredentials({ customerCode: res.profile.customerCode });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleEditCustomer = async (formData: FormData) => {
    const id = formData.get("id") as string;
    if (!id) return;
    setIsLoadingAction(true);
    try {
      await adminClient.updateCustomer(id, {
        fullName: (formData.get("fullName") as string) ?? undefined,
        phone: (formData.get("phone") as string) ?? undefined,
        address: (formData.get("address") as string) ?? undefined,
        customerType: (formData.get("customerType") as string) ?? undefined,
      });
      toast({ title: "Thành công", description: "Đã cập nhật thông tin" });
      setIsEditSheetOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminClient.toggleCustomerStatus(id, !currentStatus);
      toast({
        title: "Thành công",
        description: currentStatus ? "Đã chặn khách hàng" : "Đã mở chặn",
      });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  // NOTE: handleResetPassword removed - customers don't have auth accounts

  const stats = useMemo(() => {
    return {
      total: metadata?.total || 0,
      active: 0, // Simplified
      inactive: 0, // Simplified
      totalSpent: customers.reduce((acc, curr) => acc + Number(curr.totalSpent || 0), 0),
    };
  }, [customers, metadata]);

  const columns: ColumnDef<CustomerStatsItem>[] = [
    {
      accessorKey: "avatarUrl",
      header: () => <div className="text-center">Avatar</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
            <AvatarImage src={row.original.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {row.original.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-black text-slate-900 dark:text-white">{row.original.fullName}</span>
          <span className="flex items-center gap-1 text-[10px] font-bold tracking-tight text-slate-500 uppercase">
            <Badge variant="outline" className="h-4 px-1 text-[8px] font-black uppercase">
              {row.original.customerType === "wholesale" ? "Sỉ" : "Lẻ"}
            </Badge>
            Mã: {row.original.customerCode}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "contact",
      header: "Liên hệ",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Phone className="h-3 w-3" />
            {row.original.phone || "---"}
          </div>
          <div className="flex max-w-[150px] items-center gap-2 truncate text-[10px] font-medium text-slate-400">
            <MapPin className="h-3 w-3" />
            {row.original.address || "---"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "orderCount",
      header: "Đơn hàng",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-white">
            {row.original.orderCount}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: "Tổng chi tiêu",
      cell: ({ row }) => (
        <span className="font-black text-slate-900 dark:text-white">
          {formatCurrency(Number(row.original.totalSpent))}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          className={`${row.original.isActive ? STATUS_CONFIG.Active.color : STATUS_CONFIG.Inactive.color} border text-[10px] font-black tracking-tight uppercase`}
        >
          {row.original.isActive ? STATUS_CONFIG.Active.label : STATUS_CONFIG.Inactive.label}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
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
                <Link href={`/customers/${row.original.id}`}>
                  <UserCheck className="text-primary h-4 w-4" /> Xem chi tiết
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-10 gap-2"
                onClick={() => {
                  setEditingCustomer(row.original);
                  setIsEditSheetOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="h-10 gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 dark:focus:bg-red-950/20"
                onClick={() => handleToggleStatus(row.original.id, !!row.original.isActive)}
              >
                <Ban className="h-4 w-4" /> {row.original.isActive ? "Chặn" : "Mở chặn"} khách hàng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Quản lý khách hàng
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            Theo dõi thông tin, lịch sử mua hàng và quản lý tài khoản khách hàng.
          </p>
        </div>

        <CustomerAddSheet
          isOpen={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          isSubmitting={isLoadingAction}
          onSubmit={handleAddCustomer}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-950/50 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Tổng khách hàng
            </CardTitle>
            <Users className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.total}</div>
            <p className="text-primary mt-1 text-[10px] font-bold tracking-tight uppercase">
              Tất cả tài khoản
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-950/50 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Đang hoạt động
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.active}</div>
            <p className="mt-1 text-xs font-bold tracking-tight text-emerald-500/80 uppercase">
              Tài khoản khả dụng
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-950/50 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Ngừng hoạt động
            </CardTitle>
            <Ban className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.inactive}</div>
            <p className="mt-1 text-xs font-bold tracking-tight text-slate-400 uppercase">
              Đã bị chặn/khóa
            </p>
          </CardContent>
        </Card>

        <Card className="ring-primary/10 bg-primary/5 dark:bg-primary/10 border-none shadow-sm ring-1 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-primary/70 text-sm font-black tracking-wider uppercase">
              Tổng doanh thu
            </CardTitle>
            <CreditCard className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-primary text-2xl font-black">
              {formatCurrency(stats.totalSpent)}
            </div>
            <p className="text-primary/60 mt-1 text-xs font-bold tracking-tight uppercase">
              Doanh thu lũy kế
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm theo tên, mã khách hàng..."
                defaultValue={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 gap-2 rounded-xl border-slate-200 font-black dark:border-slate-800"
                  >
                    <Filter className="h-4 w-4" />
                    {statusFilter === "All"
                      ? "Tất cả trạng thái"
                      : STATUS_CONFIG[statusFilter]?.label || "Trạng thái"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-bold">
                  <DropdownMenuLabel>Lọc theo trạng thái</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("All")}>
                    Tất cả trạng thái
                  </DropdownMenuItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => handleStatusFilterChange(key)}>
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={customers}
            isLoading={isLoading}
            pageCount={metadata?.totalPages || 1}
            pagination={{
              pageIndex: page - 1,
              pageSize: limit,
            }}
            onPaginationChange={(newPagination) => {
              updateParams({
                page: newPagination.pageIndex + 1,
                limit: newPagination.pageSize,
              });
            }}
            emptyMessage="Không tìm thấy khách hàng nào."
            onRowClick={(row) => router.push(`/customers/${row.original.id}`)}
          />
        </CardContent>
      </Card>

      {/* Edit Customer Sheet */}
      <CustomerEditSheet
        isOpen={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        customer={editingCustomer}
        isSubmitting={isLoadingAction}
        onSubmit={handleEditCustomer}
      />

      {/* Credentials Dialog */}
      <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl sm:max-w-md">
          <DialogHeader className="items-center space-y-4 pt-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-black">Tạo khách hàng thành công!</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Mã khách hàng đã được tạo tự động. Ghi lại mã này để tra cứu sau.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Mã khách hàng
              </p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {showCredentials?.customerCode}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(showCredentials?.customerCode);
                    toast({ title: "Copied!", duration: 1000 });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
