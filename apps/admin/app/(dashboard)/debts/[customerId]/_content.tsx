"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomerDebtResponse } from "@workspace/database/types/admin";
import type { FulfillmentStatusValue, PaymentStatusValue } from "@workspace/shared/constants";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency, formatDate } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { ChevronLeft, CircleDollarSign, Smartphone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BulkPaymentDialog } from "@/components/admin/debts/bulk-payment-dialog";
import { FULFILLMENT_BADGE, PAYMENT_BADGE } from "@/lib/order-badges";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

function formatYmd(date: Date | string | null | undefined): string {
  if (!date) return "---";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "---";
  return d.toISOString().slice(0, 10);
}

function paymentMethodLabel(method: string): string {
  if (method === "cash") return "Tiền mặt";
  if (method === "bank_transfer") return "Chuyển khoản";
  if (method === "card") return "Thẻ";
  return method;
}

export default function DebtDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery<CustomerDebtResponse>({
    queryKey: queryKeys.customerDebt(customerId),
    queryFn: () => adminClient.getCustomerDebt(customerId),
    enabled: Boolean(customerId),
    retry: false,
  });

  const isNotFound = (error as any)?.response?.status === 404;

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.customerDebt(customerId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all }),
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <BackLink />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Đang tải...
        </div>
      </div>
    );
  }

  if (isError && isNotFound) {
    return (
      <div className="flex flex-col gap-8">
        <BackLink />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <h2 className="text-xl font-bold">Không tìm thấy khách hàng</h2>
          <Button asChild>
            <Link href={ADMIN_ROUTES.DEBTS}>Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-8">
        <BackLink />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <h2 className="text-xl font-bold text-destructive">Có lỗi xảy ra khi tải dữ liệu</h2>
        </div>
      </div>
    );
  }

  const { customer, totalDebt, unpaidOrders, paymentHistory, allOrders } = data;
  const totalOrderValue = allOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const totalPaid = paymentHistory.reduce((s, p) => s + Number(p.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-8">
      <BackLink />

      {/* Header */}
      <Card className="overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {customer.fullName || "---"}
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Smartphone className="h-4 w-4" />
                <span>{customer.phone || "---"}</span>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 md:items-end">
              <Button
                size="lg"
                className="gap-2 font-bold"
                onClick={() => setDialogOpen(true)}
                disabled={totalDebt <= 0}
              >
                <CircleDollarSign className="h-5 w-5" />
                Thu tiền
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Tổng nợ" value={formatCurrency(totalDebt)} highlight={totalDebt > 0} />
            <Stat label="Số đơn nợ" value={unpaidOrders.length.toString()} />
            <Stat label="Tổng giá trị đơn" value={formatCurrency(totalOrderValue)} />
            <Stat label="Tổng đã thu" value={formatCurrency(totalPaid)} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="unpaid">
        <TabsList>
          <TabsTrigger value="unpaid">Đơn đang nợ ({unpaidOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Lịch sử thanh toán ({paymentHistory.length})</TabsTrigger>
          <TabsTrigger value="all">Tất cả đơn ({allOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid">
          <Card className="overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
            <CardContent className="p-0">
              {unpaidOrders.length === 0 ? (
                <EmptyRow message="Không có đơn nợ." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Ngày báo hết</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Đã trả</TableHead>
                        <TableHead className="text-right">Còn nợ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidOrders.map((o) => {
                        const debt = Number(o.total ?? 0) - Number(o.paidAmount ?? 0);
                        return (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link
                                href={ADMIN_ROUTES.ORDER_DETAIL(o.id)}
                                className="text-primary font-bold hover:underline"
                              >
                                {o.orderNumber}
                              </Link>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatYmd(o.stockOutAt)}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(o.total)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(o.paidAmount ?? 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                              {formatCurrency(debt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
            <CardContent className="p-0">
              {paymentHistory.length === 0 ? (
                <EmptyRow message="Chưa có giao dịch thanh toán." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>Mã tham chiếu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(p.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={ADMIN_ROUTES.ORDER_DETAIL(p.orderId)}
                              className="text-primary font-bold hover:underline"
                            >
                              Xem đơn
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(p.amount)}
                          </TableCell>
                          <TableCell>{paymentMethodLabel(p.method)}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {p.referenceCode || "---"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
            <CardContent className="p-0">
              {allOrders.length === 0 ? (
                <EmptyRow message="Không có đơn hàng nào." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Đã trả</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOrders.map((o) => {
                        const pBadge = PAYMENT_BADGE[o.paymentStatus as PaymentStatusValue];
                        const fBadge =
                          FULFILLMENT_BADGE[o.fulfillmentStatus as FulfillmentStatusValue];
                        return (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link
                                href={ADMIN_ROUTES.ORDER_DETAIL(o.id)}
                                className="text-primary font-bold hover:underline"
                              >
                                {o.orderNumber}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1">
                                {pBadge && (
                                  <Badge variant="outline" className={pBadge.className}>
                                    {pBadge.label}
                                  </Badge>
                                )}
                                {fBadge && (
                                  <Badge variant="outline" className={fBadge.className}>
                                    {fBadge.label}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(o.total)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(o.paidAmount ?? 0)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatYmd(o.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BulkPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        unpaidOrders={unpaidOrders}
        totalDebt={totalDebt}
        onSuccess={async ({ paidAmount, affectedOrders }) => {
          toast.success("Thu tiền thành công", {
            description: `Đã thanh toán ${formatCurrency(paidAmount)} vào ${affectedOrders} đơn.`,
          });
          setDialogOpen(false);
          await invalidateAll();
        }}
        onError={async ({ message }) => {
          toast.error("Lỗi", { description: message });
          // A mid-loop failure may have posted some payments already — refresh either way.
          await invalidateAll();
        }}
      />
    </div>
  );
}

function BackLink() {
  return (
    <div>
      <Button variant="ghost" asChild className="gap-2 font-bold hover:bg-slate-100">
        <Link href={ADMIN_ROUTES.DEBTS}>
          <ChevronLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </Button>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span
        className={
          highlight ? "text-xl font-black text-red-600" : "text-xl font-black text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="py-12 text-center text-sm font-medium text-slate-500">{message}</div>;
}
