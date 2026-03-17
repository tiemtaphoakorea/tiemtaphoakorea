"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, CalendarDays, MoreHorizontal, Truck } from "lucide-react";
import { useMemo, useState } from "react";
// Components
import { SupplierOrderAddSheet } from "@/components/admin/supplier-order-add-sheet";
import { SupplierOrderHeader } from "@/components/admin/supplier-orders/supplier-order-header";
import { SupplierOrderStatusDialog } from "@/components/admin/supplier-orders/supplier-order-status-dialog";
import { SupplierOrderToolbar } from "@/components/admin/supplier-orders/supplier-order-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { PAGINATION_DEFAULT } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import { adminClient } from "@/services/admin.client";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    icon: Truck,
  },
  ordered: {
    label: "Đã đặt hàng",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    icon: Truck,
  },
  received: {
    label: "Đã nhận hàng",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: Truck,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-slate-50 text-slate-600 border-slate-100",
    icon: Truck,
  },
};

export default function SupplierOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Pagination State
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGINATION_DEFAULT.LIMIT,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "supplier-orders", { search, status }],
    queryFn: async () => {
      const orders = await adminClient.getSupplierOrders({
        search,
        status: status !== "All" ? status : undefined,
      });
      return orders;
    },
  });

  // Client-side pagination logic
  const { paginatedData, pageCount } = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    const currentData = orders.slice(start, end);
    const pageCount = Math.ceil(orders.length / pagination.pageSize);
    return { paginatedData: currentData, pageCount };
  }, [orders, pagination]);

  const { data: productsData = { products: [] } } = useQuery({
    queryKey: ["admin", "products", { include: "variants" }],
    queryFn: async () => {
      return adminClient.getProductsWithVariants();
    },
    enabled: isAddSheetOpen,
  });

  const { data: suppliersData = { suppliers: [] } } = useQuery({
    queryKey: ["admin", "suppliers", { status: "active" }],
    queryFn: async () => {
      return adminClient.getSuppliers(); // Existing method getSuppliers takes optional search
    },
    enabled: isAddSheetOpen,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminClient.createSupplierOrder(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "supplier-orders"] });
      setIsAddSheetOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo đơn nhập hàng mới",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return adminClient.updateSupplierOrderStatus(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "supplier-orders"] });
      setIsUpdateDialogOpen(false);
      setSelectedOrder(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái đơn hàng",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Mã đơn gốc",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-black text-slate-900 dark:text-white">
              {row.original.order?.orderNumber ? `#${row.original.order.orderNumber}` : "-"}
            </span>
            <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
              {row.original.order?.customerName || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "product",
        header: "Sản phẩm",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {row.original.item.productName}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 bg-slate-50 px-1.5 text-[10px]">
                {row.original.item.variantName}
              </Badge>
              <span className="font-mono text-xs text-slate-500">{row.original.item.sku}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: "SL",
        cell: ({ row }) => (
          <span className="font-bold text-slate-900 dark:text-white">{row.original.quantity}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const orderStatus = row.original.status || "pending";
          const config = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.pending;
          const StatusIcon = config.icon;
          return (
            <Badge
              className={`${config.color} pointer-events-none flex w-fit items-center gap-1 border px-2 py-0.5 text-[10px] font-black tracking-tight uppercase shadow-none select-none`}
            >
              {StatusIcon && <StatusIcon className="h-3 w-3" />}
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "orderedAt",
        header: "Ngày đặt",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
            {row.original.orderedAt ? (
              <>
                <CalendarDays className="h-3 w-3 text-slate-400" />
                {formatDate(row.original.orderedAt)}
              </>
            ) : (
              "-"
            )}
          </div>
        ),
      },
      {
        accessorKey: "expectedDate",
        header: "Ngày về (Dự kiến)",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
            {row.original.expectedDate ? (
              <>
                <Calendar className="h-3 w-3 text-slate-400" />
                {formatDate(row.original.expectedDate)}
              </>
            ) : (
              "-"
            )}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedOrder(row.original);
                  setIsUpdateDialogOpen(true);
                }}
              >
                Cập nhật trạng thái
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-8">
      <SupplierOrderHeader onAddClick={() => setIsAddSheetOpen(true)} />

      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <SupplierOrderToolbar
            searchTerm={search}
            onSearchChange={setSearch}
            statusFilter={status}
            onStatusChange={setStatus}
            statusConfig={STATUS_CONFIG}
          />
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={paginatedData}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Truck className="h-12 w-12 text-slate-300" data-icon="truck" />
                <div className="flex flex-col gap-1 text-center">
                  <p className="text-sm font-semibold text-slate-700">Không có đơn đặt hàng nào</p>
                  <p className="text-xs text-slate-500">
                    Các đơn hàng Pre-order sẽ xuất hiện tại đây
                  </p>
                </div>
              </div>
            }
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </CardContent>
      </Card>

      <SupplierOrderAddSheet
        isOpen={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        products={productsData.products}
        suppliers={suppliersData.suppliers}
        onCreateOrder={createOrderMutation.mutate}
        isCreatingOrder={createOrderMutation.isPending}
      />

      {selectedOrder && (
        <SupplierOrderStatusDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          selectedOrder={selectedOrder}
          statusConfig={STATUS_CONFIG}
          isSubmitting={updateStatusMutation.isPending}
          onUpdateStatus={updateStatusMutation.mutate}
          onClose={() => {
            setIsUpdateDialogOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}
