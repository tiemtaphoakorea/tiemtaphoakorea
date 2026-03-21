"use client";

import { ORDER_STATUS } from "@workspace/shared/constants";
import { formatCurrency, formatDate, formatVariantDisplayName } from "@workspace/shared/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { NumberInput } from "@workspace/ui/components/number-input";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Separator } from "@workspace/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Textarea } from "@workspace/ui/components/textarea";
import { useToast } from "@workspace/ui/components/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  Printer,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use, useState } from "react";
import { adminClient } from "@/services/admin.client";

type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** Khai báo trạng thái đơn hàng: nhãn hiển thị, màu, icon */
const ORDER_STATUSES: Record<
  OrderStatusValue,
  { label: string; color: string; icon: typeof Clock }
> = {
  [ORDER_STATUS.PENDING]: {
    label: "Chờ xử lý",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    icon: Clock,
  },
  [ORDER_STATUS.PAID]: {
    label: "Đã thanh toán",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: CheckCircle2,
  },
  [ORDER_STATUS.PREPARING]: {
    label: "Đang đóng gói",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    icon: Package,
  },
  [ORDER_STATUS.SHIPPING]: {
    label: "Đang giao hàng",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    icon: Truck,
  },
  [ORDER_STATUS.DELIVERED]: {
    label: "Giao thành công",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: CheckCircle2,
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-600 border-red-100",
    icon: XCircle,
  },
};

/** Khai báo nút hành động hiển thị tại mỗi trạng thái: chuyển sang trạng thái nào + nhãn nút (hành động) */
const ORDER_STATUS_ACTIONS: Record<
  OrderStatusValue,
  Array<{ nextStatus: OrderStatusValue; actionLabel: string }>
> = {
  [ORDER_STATUS.PENDING]: [{ nextStatus: ORDER_STATUS.CANCELLED, actionLabel: "Hủy đơn" }],
  [ORDER_STATUS.PAID]: [{ nextStatus: ORDER_STATUS.DELIVERED, actionLabel: "Đánh dấu đã giao" }],
  [ORDER_STATUS.PREPARING]: [
    { nextStatus: ORDER_STATUS.DELIVERED, actionLabel: "Đánh dấu đã giao" },
    { nextStatus: ORDER_STATUS.CANCELLED, actionLabel: "Hủy đơn" },
  ],
  [ORDER_STATUS.SHIPPING]: [
    { nextStatus: ORDER_STATUS.DELIVERED, actionLabel: "Đánh dấu đã giao" },
    { nextStatus: ORDER_STATUS.CANCELLED, actionLabel: "Hủy đơn" },
  ],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  "use no memo";
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data Fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => adminClient.getOrder(id),
  });

  const order = data?.order;

  // Local State
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editAdminNote, setEditAdminNote] = useState("");
  const [editDiscount, setEditDiscount] = useState(0);

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="text-destructive h-12 w-12" />
        <h2 className="text-xl font-bold">Không tìm thấy đơn hàng</h2>
        <Button onClick={() => router.push("/orders")}>Quay lại danh sách</Button>
      </div>
    );
  }

  const remainingAmount = Math.max(0, Number(order.total) - Number(order.paidAmount || 0));

  const status: OrderStatusValue = (order.status as OrderStatusValue) || ORDER_STATUS.PENDING;
  const statusConfig = ORDER_STATUSES[status] ?? ORDER_STATUSES[ORDER_STATUS.PENDING];
  const statusActions = ORDER_STATUS_ACTIONS[status] ?? [];
  const isTerminal = statusActions.length === 0;
  const canDelete = status === ORDER_STATUS.CANCELLED;

  // Handlers
  const handleOpenPayment = () => {
    setPaymentAmount(remainingAmount);
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async () => {
    if (paymentAmount <= 0) return;

    try {
      await adminClient.recordOrderPayment(order.id, {
        amount: paymentAmount,
        method: paymentMethod,
        referenceCode: paymentRef || undefined,
        note: paymentNote || undefined,
      });
      toast({ title: "Thành công", description: "Đã ghi nhận thanh toán." });
      setIsPaymentOpen(false);
      setPaymentRef("");
      setPaymentNote("");
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (
      confirm(`Bạn có chắc chắn muốn chuyển trạng thái sang "${ORDER_STATUSES[newStatus].label}"?`)
    ) {
      try {
        await adminClient.updateOrderStatus(order.id, {
          status: newStatus,
          note: note,
        });
        toast({
          title: "Thành công",
          description: "Cập nhật trạng thái thành công",
        });
        setNote("");
        await queryClient.invalidateQueries({ queryKey: ["order", id] });
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await adminClient.updateOrder(order.id, {
        adminNote: editAdminNote,
        discount: editDiscount,
      });
      toast({
        title: "Thành công",
        description: "Cập nhật đơn hàng thành công",
      });
      setIsEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) return;
    try {
      await adminClient.deleteOrder(order.id);
      router.push("/orders?deleted=true");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orders">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                #{order.orderNumber}
              </h1>
              <Badge
                className={`${statusConfig.color} border px-2 py-1 text-xs font-black uppercase`}
              >
                <statusConfig.icon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Clock className="h-3 w-3" /> Tạo lúc: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-bold">
            <Printer className="h-4 w-4" /> In hóa đơn
          </Button>

          {status !== ORDER_STATUS.PAID && (
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleOpenPayment}
                  className="gap-2 bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
                >
                  <Banknote className="h-4 w-4" /> Thanh toán
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ghi nhận thanh toán</DialogTitle>
                  <DialogDescription>
                    Tạo phiếu thu cho đơn hàng #{order.orderNumber}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Số tiền thanh toán</Label>
                    <NumberInput
                      value={paymentAmount}
                      onValueChange={(values) => setPaymentAmount(values.floatValue ?? 0)}
                      max={remainingAmount}
                    />
                    <p className="text-muted-foreground text-xs">
                      Còn nợ: {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phương thức</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Tiền mặt</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bank_transfer" id="bank" />
                        <Label htmlFor="bank">Chuyển khoản</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card">Thẻ</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {paymentMethod === "bank_transfer" && (
                    <div className="space-y-2">
                      <Label>Mã tham chiếu (Mã GD)</Label>
                      <Input
                        placeholder="VD: FT2332..."
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Input
                      placeholder="Ghi chú nội bộ..."
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={handleRecordPayment}
                    className="bg-emerald-600 font-bold hover:bg-emerald-700"
                  >
                    Lưu thanh toán
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {/* Status Actions */}
          {!isTerminal && statusActions.length > 0 && (
            <div className="flex items-center gap-2">
              {statusActions.map((action) => (
                <Button
                  key={action.nextStatus}
                  variant={action.nextStatus === ORDER_STATUS.CANCELLED ? "destructive" : "default"}
                  className={`font-bold shadow-lg ${
                    action.nextStatus !== ORDER_STATUS.CANCELLED
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : ""
                  }`}
                  onClick={() => handleStatusUpdate(action.nextStatus)}
                >
                  {action.actionLabel}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Parent Order Link (if child) */}
          {order.parentOrder && (
            <Card className="border-blue-100 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-100">
                    Đơn hàng được tách từ đơn gốc
                  </div>
                  <Link
                    href={`/orders/${order.parentOrder.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Xem đơn gốc #{order.parentOrder.orderNumber}
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-orders (if parent) */}
          {order.subOrders && order.subOrders.length > 0 && (
            <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                  <Package className="text-primary h-5 w-5" /> Đơn hàng con (
                  {order.subOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {order.subOrders.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="hover:border-primary/50 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg border border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                        <Package className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <Link
                          href={`/orders/${sub.id}`}
                          className="hover:text-primary font-black text-slate-900 hover:underline dark:text-white"
                        >
                          #{sub.orderNumber}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-white text-[10px] dark:bg-slate-950"
                          >
                            {sub.splitType === "in_stock"
                              ? "Hàng có sẵn"
                              : sub.splitType === "pre_order"
                                ? "Hàng đặt trước"
                                : "Đơn thường"}
                          </Badge>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-primary text-xs font-bold">
                            {formatCurrency(Number(sub.total))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {ORDER_STATUSES[sub.status] ? (
                        <Badge
                          className={`${
                            ORDER_STATUSES[sub.status].color
                          } border px-2 py-1 text-[10px] font-bold uppercase`}
                        >
                          {ORDER_STATUSES[sub.status].label}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{sub.status}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="gap-0 border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                <Package className="text-primary h-5 w-5" /> Chi tiết sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Sản phẩm</TableHead>
                    <TableHead className="text-center">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.variant.images?.[0] ? (
                            <Image
                              src={item.variant.images[0].imageUrl}
                              alt={`${formatVariantDisplayName(
                                item.productName,
                              )} - ${formatVariantDisplayName(item.variantName)}`}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-lg bg-slate-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                              <ShoppingBag className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatVariantDisplayName(item.productName)}
                            </div>
                            <div className="font-mono text-xs text-slate-500">
                              {formatVariantDisplayName(item.variantName)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-slate-600">
                        {formatCurrency(Number(item.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(Number(item.lineTotal))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-col items-end gap-2 border-t border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex w-full max-w-xs justify-between text-sm font-medium text-slate-500">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-xl font-black text-slate-900 dark:text-white">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatCurrency(Number(order.total))}</span>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="mt-4 flex w-full flex-col items-end gap-2 border-t border-slate-100 px-6 pt-4 pb-6 dark:border-slate-800">
                <div className="flex w-full max-w-xs justify-between text-sm font-medium text-emerald-600">
                  <span>Đã thanh toán</span>
                  <span>{formatCurrency(Number(order.paidAmount || 0))}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-sm font-bold text-red-500">
                  <span>Còn lại</span>
                  <span>
                    {formatCurrency(
                      Math.max(0, Number(order.total) - Number(order.paidAmount || 0)),
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {order.payments && order.payments.length > 0 && (
            <Card className="gap-0 border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                  <Wallet className="h-5 w-5 text-emerald-600" /> Lịch sử thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Ghi chú/Mã</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="text-right">Người thu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium text-slate-500">
                          {formatDate(p.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {p.method === "bank_transfer"
                              ? "Chuyển khoản"
                              : p.method === "card"
                                ? "Thẻ"
                                : "Tiền mặt"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.referenceCode && (
                            <span className="mr-2 font-mono text-slate-500">
                              #{p.referenceCode}
                            </span>
                          )}
                          {p.note}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(Number(p.amount))}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {p.creator?.fullName || "System"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Note Input (Only if not terminal) */}
          {!isTerminal && (
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="px-6">
                <label
                  htmlFor="order-status-note"
                  className="mb-2 block text-sm font-black tracking-wider text-slate-500 uppercase"
                >
                  Ghi chú cập nhật (tùy chọn)
                </label>
                <p className="mb-3 -mt-1 text-xs font-medium italic text-slate-400">
                  * Ghi chú này sẽ được lưu vào lịch sử khi bạn nhấn một trong các nút cập nhật
                  trạng thái ở trên (ví dụ: "Giao thành công", "Hủy đơn").
                </p>
                <div className="flex gap-4">
                  <input
                    id="order-status-note"
                    className="focus:ring-primary/20 h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 focus:ring-2 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    placeholder="Nhập ghi chú cho lần cập nhật trạng thái này..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card className="gap-0 border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                <Clock className="h-5 w-5 text-slate-500" /> Lịch sử trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="relative ml-6 space-y-8 border-l-2 border-slate-100 py-2 pl-6 dark:border-slate-800">
              {order.statusHistory.map((history: any) => (
                <div key={history.id} className="relative">
                  <div
                    className={`absolute top-1 -left-[31px] h-4 w-4 rounded-full border-2 border-white dark:border-slate-950 ${
                      ORDER_STATUSES[history.status]
                        ? ORDER_STATUSES[history.status].color.split(" ")[0]
                        : "bg-slate-500"
                    } ${
                      ORDER_STATUSES[history.status]
                        ? ORDER_STATUSES[history.status].color.split(" ")[1]
                        : "text-slate-500"
                    }`}
                  ></div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                      {ORDER_STATUSES[history.status]
                        ? ORDER_STATUSES[history.status].label
                        : history.status}
                      <span className="ml-auto font-mono text-[10px] font-normal text-slate-400">
                        {formatDate(history.createdAt)}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Cập nhật bởi: {history.creator?.fullName || "Admin"}
                    </span>
                    {history.note && (
                      <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600 italic dark:bg-slate-900 dark:text-slate-400">
                        "{history.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer & Meta */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                <User className="text-primary h-5 w-5" /> Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={order.customer.avatarUrl || undefined} />
                  <AvatarFallback>{order.customer.fullName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-black text-slate-900 dark:text-white">
                    {order.customer.fullName}
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    {order.customer.customerCode}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span>{order.customer.phone || "Không có SĐT"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span>{order.customer.address || "Không có địa chỉ"}</span>
                </div>
              </div>
              <Separator />

              {/* Admin Note & Discount - Editable */}
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="adminNote"
                      className="text-xs font-black tracking-wider text-slate-400 uppercase"
                    >
                      Ghi chú admin
                    </Label>
                    <Textarea
                      id="adminNote"
                      value={editAdminNote}
                      onChange={(e) => setEditAdminNote(e.target.value)}
                      placeholder="Nhập ghi chú..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="discount"
                      className="text-xs font-black tracking-wider text-slate-400 uppercase"
                    >
                      Giảm giá (VND)
                    </Label>
                    <NumberInput
                      id="discount"
                      value={editDiscount}
                      onValueChange={(values) => setEditDiscount(values.floatValue ?? 0)}
                      placeholder="0"
                      decimalScale={0}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="flex-1 font-bold">
                      Lưu
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 font-bold"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black tracking-wider text-slate-400 uppercase">
                      Ghi chú admin
                    </p>
                    <p className="text-sm font-medium">{order.adminNote || "--"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black tracking-wider text-slate-400 uppercase">
                      Ghi chú giảm giá (VND)
                    </p>
                    <p className="text-sm font-medium">
                      {formatCurrency(Number(order.discount || 0))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-bold"
                    onClick={() => {
                      setEditAdminNote(order.adminNote || "");
                      setEditDiscount(order.discount ? Number(order.discount) : 0);
                      setIsEditing(true);
                    }}
                  >
                    <Package className="mr-2 h-4 w-4" /> Chỉnh sửa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {canDelete && (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950"
              onClick={handleDelete}
              data-testid="delete-order-button"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Xóa đơn hàng
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
