"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomerDetail } from "@workspace/database/types/admin";
import { formatDate } from "@workspace/shared/utils";
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
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerFinancialStats } from "@/components/admin/customer-detail/customer-financial-stats";
import { CustomerLocationCard } from "@/components/admin/customer-detail/customer-location-card";
import { CustomerOrderHistoryTable } from "@/components/admin/customer-detail/customer-order-history-table";
import { CustomerProfileHeader } from "@/components/admin/customer-detail/customer-profile-header";
import { CustomerSecurityCard } from "@/components/admin/customer-detail/customer-security-card";
import { CustomerEditSheet } from "@/components/admin/customers/customer-edit-sheet";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function CustomerDetailPage() {
  "use no memo";
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  type ConfirmAction = "block" | "delete" | null;
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const { data, isLoading, isError } = useQuery<{ customer?: CustomerDetail }>({
    queryKey: queryKeys.customer(id),
    queryFn: () => adminClient.getCustomer(id),
    enabled: Boolean(id),
  });
  const customer = data?.customer ?? null;

  const handleEditCustomer = async (formData: FormData) => {
    const customerId = formData.get("id") as string;
    if (!customerId) return;
    setIsSubmitting(true);
    const payload = {
      fullName: (formData.get("fullName") as string) ?? undefined,
      phone: (formData.get("phone") as string) ?? undefined,
      address: (formData.get("address") as string) ?? undefined,
      customerType: (formData.get("customerType") as string) ?? undefined,
    };
    try {
      await adminClient.updateCustomer(customerId, payload);
      toast.success("Đã cập nhật thông tin khách hàng");
      setIsEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.customer(id) });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const doToggleStatus = async () => {
    if (!customer) return;
    const nextActive = !customer.isActive;
    setIsToggling(true);
    try {
      await adminClient.toggleCustomerStatus(id, nextActive);
      toast.success(nextActive ? "Đã mở chặn khách hàng" : "Đã chặn khách hàng");
      await queryClient.invalidateQueries({ queryKey: queryKeys.customer(id) });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra");
    } finally {
      setIsToggling(false);
    }
  };

  const doDelete = async () => {
    if (!customer) return;
    setIsDeleting(true);
    try {
      await adminClient.deleteCustomer(id);
      toast.success("Đã xóa khách hàng");
      router.push("/admin/customers");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra");
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = () => {
    if (!customer) return;
    if (customer.isActive) {
      setConfirmAction("block");
    } else {
      doToggleStatus();
    }
  };

  const handleDelete = () => {
    if (!customer) return;
    setConfirmAction("delete");
  };

  const handleConfirm = () => {
    if (confirmAction === "block") doToggleStatus();
    else if (confirmAction === "delete") doDelete();
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="gap-2 font-bold hover:bg-slate-100">
            <Link href="/admin/customers">
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Đang tải...
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col gap-8 pb-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="gap-2 font-bold hover:bg-slate-100">
            <Link href="/admin/customers">
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
          <p>Không tìm thấy khách hàng.</p>
          <Button variant="outline" onClick={() => router.push("/admin/customers")}>
            Về danh sách khách hàng
          </Button>
        </div>
      </div>
    );
  }

  const totalSpent = customer.orders.reduce(
    (acc: number, order: { total: string | number }) => acc + Number(order.total),
    0,
  );
  const lastOrder = customer.orders[0];

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" asChild className="gap-2 font-bold hover:bg-slate-100">
          <Link href="/admin/customers">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={isToggling}
            className="font-bold"
          >
            {customer.isActive ? "Chặn" : "Mở chặn"}
          </Button>
          <Button onClick={() => setIsEditOpen(true)} className="font-bold">
            Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="font-bold"
          >
            Xóa KH
          </Button>
        </div>
      </div>

      <CustomerEditSheet
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        customer={customer}
        isSubmitting={isSubmitting}
        onSubmit={handleEditCustomer}
      />

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "block" ? "Chặn khách hàng" : "Xóa khách hàng"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "block"
                ? "Khách hàng sẽ không thể đăng nhập sau khi bị chặn."
                : "Hành động này không thể hoàn tác. Khách hàng sẽ bị xóa vĩnh viễn."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              onClick={handleConfirm}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomerProfileHeader customer={customer} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-1">
          <CustomerFinancialStats totalSpent={totalSpent} orderCount={customer.orders.length} />
          <CustomerLocationCard address={customer.address} />
          <CustomerSecurityCard
            createdAt={customer.createdAt}
            lastActive={lastOrder?.createdAt || customer.updatedAt}
            formatDate={formatDate}
          />
        </div>

        <div className="lg:col-span-2">
          <CustomerOrderHistoryTable orders={customer.orders} formatDate={formatDate} />
        </div>
      </div>
    </div>
  );
}
