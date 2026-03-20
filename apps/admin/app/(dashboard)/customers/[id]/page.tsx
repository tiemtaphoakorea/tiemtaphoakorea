"use client";

import type { CustomerDetail } from "@repo/database/types/admin";
import { formatDate } from "@repo/shared/utils";
import { Button } from "@repo/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CustomerFinancialStats } from "@/components/admin/customer-detail/customer-financial-stats";
import { CustomerLocationCard } from "@/components/admin/customer-detail/customer-location-card";
import { CustomerOrderHistoryTable } from "@/components/admin/customer-detail/customer-order-history-table";
import { CustomerProfileHeader } from "@/components/admin/customer-detail/customer-profile-header";
import { CustomerSecurityCard } from "@/components/admin/customer-detail/customer-security-card";
import { adminClient } from "@/services/admin.client";

export default function CustomerDetailPage() {
  "use no memo";
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading, isError } = useQuery<{ customer?: CustomerDetail }>({
    queryKey: ["customer", id],
    queryFn: () => adminClient.getCustomer(id),
    enabled: Boolean(id),
  });
  const customer = data?.customer ?? null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            asChild
            className="gap-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
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
          <Button
            variant="ghost"
            asChild
            className="gap-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          asChild
          className="gap-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Link href="/admin/customers">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </Button>
      </div>

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
