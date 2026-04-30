"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { CustomerStatsItem } from "@workspace/database/types/admin";
import { PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { formatCurrency } from "@workspace/shared/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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
  Settings2,
  ShoppingBag,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { CustomerAddSheet } from "@/components/admin/customers/customer-add-sheet";
import { CustomerEditSheet } from "@/components/admin/customers/customer-edit-sheet";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const CUSTOMER_TYPE_CONFIG = {
  wholesale: {
    label: "Khách sỉ",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  },
  retail: {
    label: "Khách lẻ",
    className:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
};

type TierConfig = {
  loyalMinOrders: number;
  loyalMinSpent: number;
  frequentMinOrders: number;
  frequentMinSpent: number;
};

const DEFAULT_TIER_CONFIG: TierConfig = {
  loyalMinOrders: 10,
  loyalMinSpent: 5_000_000,
  frequentMinOrders: 5,
  frequentMinSpent: 2_000_000,
};

function getCustomerTier(orderCount: number, totalSpent: number, config: TierConfig) {
  if (orderCount === 0)
    return {
      label: "Tiềm năng",
      className:
        "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    };
  if (orderCount >= config.loyalMinOrders || totalSpent >= config.loyalMinSpent)
    return {
      label: "Thân thiết",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    };
  if (orderCount >= config.frequentMinOrders || totalSpent >= config.frequentMinSpent)
    return {
      label: "Mua nhiều",
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    };
  return null;
}

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

type UIState = {
  isLoadingAction: boolean;
  isAddSheetOpen: boolean;
  isEditSheetOpen: boolean;
  editingCustomer: any | null;
  showCredentials: any | null;
  deletingCustomer: any | null;
};
const initialUIState: UIState = {
  isLoadingAction: false,
  isAddSheetOpen: false,
  isEditSheetOpen: false,
  editingCustomer: null,
  showCredentials: null,
  deletingCustomer: null,
};
type UIAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "OPEN_ADD" }
  | { type: "CLOSE_ADD" }
  | { type: "OPEN_EDIT"; payload: any }
  | { type: "CLOSE_EDIT" }
  | { type: "SHOW_CREDENTIALS"; payload: any }
  | { type: "HIDE_CREDENTIALS" }
  | { type: "SET_DELETING"; payload: any | null };
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoadingAction: action.payload };
    case "OPEN_ADD":
      return { ...state, isAddSheetOpen: true };
    case "CLOSE_ADD":
      return { ...state, isAddSheetOpen: false };
    case "OPEN_EDIT":
      return { ...state, isEditSheetOpen: true, editingCustomer: action.payload };
    case "CLOSE_EDIT":
      return { ...state, isEditSheetOpen: false, editingCustomer: null };
    case "SHOW_CREDENTIALS":
      return { ...state, showCredentials: action.payload };
    case "HIDE_CREDENTIALS":
      return { ...state, showCredentials: null };
    case "SET_DELETING":
      return { ...state, deletingCustomer: action.payload };
    default:
      return state;
  }
}

type GetColumnsArgs = {
  onOpenEdit: (customer: any) => void;
  onSetDeleting: (customer: any) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  tierConfig: TierConfig;
};

function getColumns({
  onOpenEdit,
  onSetDeleting,
  onToggleStatus,
  tierConfig,
}: GetColumnsArgs): ColumnDef<CustomerStatsItem>[] {
  return [
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
      cell: ({ row }) => {
        const typeConfig =
          CUSTOMER_TYPE_CONFIG[row.original.customerType as keyof typeof CUSTOMER_TYPE_CONFIG] ??
          CUSTOMER_TYPE_CONFIG.retail;
        const tier = getCustomerTier(
          row.original.orderCount,
          Number(row.original.totalSpent),
          tierConfig,
        );
        return (
          <div className="flex flex-col gap-1">
            <span className="font-black text-slate-900 dark:text-white">
              {row.original.fullName}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <Badge
                variant="outline"
                className={`h-4 px-1.5 text-[9px] font-black uppercase ${typeConfig.className}`}
              >
                {typeConfig.label}
              </Badge>
              {tier && (
                <Badge
                  variant="outline"
                  className={`h-4 px-1.5 text-[9px] font-black uppercase ${tier.className}`}
                >
                  {tier.label}
                </Badge>
              )}
              <span className="text-[10px] font-bold tracking-tight text-slate-400">
                {row.original.customerCode}
              </span>
            </div>
          </div>
        );
      },
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
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
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
              <DropdownMenuItem className="h-10 gap-2" onClick={() => onOpenEdit(row.original)}>
                <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="h-10 gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 dark:focus:bg-red-950/20"
                onClick={() => onToggleStatus(row.original.id, !!row.original.isActive)}
              >
                <Ban className="h-4 w-4" /> {row.original.isActive ? "Chặn" : "Mở chặn"} khách hàng
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-10 gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 dark:focus:bg-red-950/20"
                onClick={() => onSetDeleting(row.original)}
              >
                <Trash2 className="h-4 w-4" /> Xóa khách hàng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}

type DeleteCustomerDialogProps = {
  deletingCustomer: any | null;
  isLoadingAction: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteCustomerDialog({
  deletingCustomer,
  isLoadingAction,
  onCancel,
  onConfirm,
}: DeleteCustomerDialogProps) {
  return (
    <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa khách hàng <strong>{deletingCustomer?.fullName}</strong>? Hành động
            này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoadingAction}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoadingAction}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoadingAction ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<div />}>
      <AdminCustomersPageContent />
    </Suspense>
  );
}

function AdminCustomersPageContent() {
  "use no memo";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const urlSearchTerm = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "All";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || PAGINATION_DEFAULT.LIMIT.toString(), 10),
  );

  // Local search state with debounce so URL updates after user pauses typing.
  const [searchInput, setSearchInput] = useState(urlSearchTerm);
  const [debouncedSearch] = useDebounce(searchInput, 300);

  // Keep local input in sync if URL changes from elsewhere (e.g. back button).
  useEffect(() => {
    setSearchInput(urlSearchTerm);
  }, [urlSearchTerm]);

  // Push debounced search to URL.
  // biome-ignore lint/correctness/useExhaustiveDependencies: updateParams is recreated each render
  useEffect(() => {
    if (debouncedSearch === urlSearchTerm) return;
    updateParams({ search: debouncedSearch || null, page: 1 });
  }, [debouncedSearch, urlSearchTerm]);

  const [ui, dispatch] = useReducer(uiReducer, initialUIState);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customers.list(debouncedSearch, statusFilter, page, limit),
    queryFn: () =>
      adminClient.getCustomers({
        search: debouncedSearch,
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
    setSearchInput(val);
  };

  const handleStatusFilterChange = (val: string) => {
    updateParams({ status: val });
  };

  const handleAddCustomer = async (formData: FormData) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const payload = {
      fullName: (formData.get("fullName") as string) ?? "",
      phone: (formData.get("phone") as string) ?? undefined,
      address: (formData.get("address") as string) ?? undefined,
      customerType: (formData.get("customerType") as string) ?? "retail",
    };

    try {
      const res = await adminClient.createCustomer(payload);
      toast.success("Đã tạo khách hàng mới");
      dispatch({ type: "CLOSE_ADD" });
      dispatch({ type: "SHOW_CREDENTIALS", payload: { customerCode: res.profile.customerCode } });
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleEditCustomer = async (formData: FormData) => {
    const id = formData.get("id") as string;
    if (!id) return;
    dispatch({ type: "SET_LOADING", payload: true });
    const payload = {
      fullName: (formData.get("fullName") as string) ?? undefined,
      phone: (formData.get("phone") as string) ?? undefined,
      address: (formData.get("address") as string) ?? undefined,
      customerType: (formData.get("customerType") as string) ?? undefined,
    };

    try {
      await adminClient.updateCustomer(id, payload);
      toast.success("Đã cập nhật thông tin");
      dispatch({ type: "CLOSE_EDIT" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const successDescription = currentStatus ? "Đã chặn khách hàng" : "Đã mở chặn";

    try {
      await adminClient.toggleCustomerStatus(id, !currentStatus);
      toast.success(successDescription);
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra");
    }
  };

  const handleDeleteCustomer = async () => {
    const id = ui.deletingCustomer?.id;
    if (!id) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await adminClient.deleteCustomer(id);
      toast.success("Đã xóa khách hàng");
      dispatch({ type: "SET_DELETING", payload: null });
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // NOTE: handleResetPassword removed - customers don't have auth accounts

  const { data: statsData } = useQuery({
    queryKey: queryKeys.customers.stats,
    queryFn: () => adminClient.getCustomerStats(),
    staleTime: 1000 * 60 * 5,
  });

  const stats = statsData ?? { total: 0, withOrders: 0, withoutOrders: 0, totalSpent: 0 };

  const { data: tierConfig } = useQuery({
    queryKey: queryKeys.customers.tierConfig,
    queryFn: () => adminClient.getCustomerTierConfig(),
    staleTime: 1000 * 60 * 10,
  });

  const resolvedTierConfig = tierConfig ?? DEFAULT_TIER_CONFIG;

  const [tierSettingsOpen, setTierSettingsOpen] = useState(false);
  const [tierDraft, setTierDraft] = useState<TierConfig>(DEFAULT_TIER_CONFIG);
  const [isSavingTier, setIsSavingTier] = useState(false);

  const openTierSettings = () => {
    setTierDraft(resolvedTierConfig);
    setTierSettingsOpen(true);
  };

  const handleSaveTierConfig = async () => {
    setIsSavingTier(true);
    try {
      await adminClient.updateCustomerTierConfig(tierDraft);
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.tierConfig });
      setTierSettingsOpen(false);
      toast.success("Đã lưu cấu hình xếp hạng");
    } catch {
      toast.error("Có lỗi khi lưu cấu hình");
    } finally {
      setIsSavingTier(false);
    }
  };

  const columns = getColumns({
    onOpenEdit: (customer) => dispatch({ type: "OPEN_EDIT", payload: customer }),
    onSetDeleting: (customer) => dispatch({ type: "SET_DELETING", payload: customer }),
    onToggleStatus: handleToggleStatus,
    tierConfig: resolvedTierConfig,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Quản lý khách hàng
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            Theo dõi thông tin và lịch sử mua hàng của khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={openTierSettings}>
            <Settings2 className="h-4 w-4" />
            Cấu hình xếp hạng
          </Button>
          <CustomerAddSheet
            isOpen={ui.isAddSheetOpen}
            onOpenChange={(open) => dispatch({ type: open ? "OPEN_ADD" : "CLOSE_ADD" })}
            isSubmitting={ui.isLoadingAction}
            onSubmit={handleAddCustomer}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Tổng khách hàng
            </CardTitle>
            <Users className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.total}</div>
            <p className="mt-1 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
              Tổng cộng
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Đã mua hàng
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.withOrders}</div>
            <p className="mt-1 text-[10px] font-bold tracking-tight text-emerald-500/80 uppercase">
              Có ít nhất 1 đơn
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Chưa đặt hàng
            </CardTitle>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.withoutOrders}</div>
            <p className="mt-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
              Toàn bộ khách hàng
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
              Tổng chi tiêu
            </CardTitle>
            <CreditCard className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(stats.totalSpent)}</div>
            <p className="mt-1 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
              Toàn bộ khách hàng
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
                value={searchInput}
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
        isOpen={ui.isEditSheetOpen}
        onOpenChange={(open) =>
          open
            ? dispatch({ type: "OPEN_EDIT", payload: ui.editingCustomer })
            : dispatch({ type: "CLOSE_EDIT" })
        }
        customer={ui.editingCustomer}
        isSubmitting={ui.isLoadingAction}
        onSubmit={handleEditCustomer}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCustomerDialog
        deletingCustomer={ui.deletingCustomer}
        isLoadingAction={ui.isLoadingAction}
        onCancel={() => dispatch({ type: "SET_DELETING", payload: null })}
        onConfirm={handleDeleteCustomer}
      />

      {/* Credentials Dialog */}
      <Dialog
        open={!!ui.showCredentials}
        onOpenChange={() => dispatch({ type: "HIDE_CREDENTIALS" })}
      >
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
                  {ui.showCredentials?.customerCode}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(ui.showCredentials?.customerCode);
                    toast.success("Đã sao chép mã đăng nhập");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tier Config Dialog */}
      <Dialog open={tierSettingsOpen} onOpenChange={setTierSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Cấu hình xếp hạng khách hàng</DialogTitle>
            <DialogDescription>
              Điều kiện OR — đạt một trong hai tiêu chí là được xếp hạng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-2">
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Thân thiết
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-500">Số đơn tối thiểu</Label>
                  <Input
                    type="number"
                    min={1}
                    value={tierDraft.loyalMinOrders}
                    onChange={(e) =>
                      setTierDraft((d) => ({ ...d, loyalMinOrders: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-500">Chi tiêu tối thiểu (₫)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={tierDraft.loyalMinSpent}
                    onChange={(e) =>
                      setTierDraft((d) => ({ ...d, loyalMinSpent: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm font-black text-amber-700 dark:text-amber-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                Mua nhiều
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-500">Số đơn tối thiểu</Label>
                  <Input
                    type="number"
                    min={1}
                    value={tierDraft.frequentMinOrders}
                    onChange={(e) =>
                      setTierDraft((d) => ({ ...d, frequentMinOrders: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-500">Chi tiêu tối thiểu (₫)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={tierDraft.frequentMinSpent}
                    onChange={(e) =>
                      setTierDraft((d) => ({ ...d, frequentMinSpent: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setTierSettingsOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveTierConfig} disabled={isSavingTier}>
              {isSavingTier ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
