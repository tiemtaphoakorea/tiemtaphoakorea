"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderProductSelection, OrderProductVariant } from "@workspace/database/types/order";
import type {
  FulfillmentStatusValue,
  PaymentMethodValue,
  PaymentStatusValue,
} from "@workspace/shared/constants";
import { PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from "@workspace/shared/constants";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
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
import {
  AlertCircle,
  Banknote,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  Edit2,
  FileImage,
  FileText,
  Loader2,
  MapPin,
  Package,
  Phone,
  Printer,
  ShoppingBag,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use, useReducer, useState } from "react";
import { toast } from "sonner";
import { CustomerEditSheet } from "@/components/admin/customers/customer-edit-sheet";
import { OrderAddRow } from "@/components/admin/orders/create/order-add-row";
import { OrderShippingSection } from "@/components/admin/orders/order-shipping-section";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { StatusBadge, type StatusType } from "@/components/admin/shared/status-badge";
import { FULFILLMENT_BADGE, PAYMENT_BADGE } from "@/lib/order-badges";
import {
  copyInvoiceImage,
  exportInvoiceImage,
  getShopInfo,
  printInvoice,
} from "@/lib/print-invoice";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

// ---------------------------------------------------------------------------
// Edit reducer
// ---------------------------------------------------------------------------

type EditState = { isEditing: boolean; editAdminNote: string; editDiscount: number };
const initialEditState: EditState = { isEditing: false, editAdminNote: "", editDiscount: 0 };
type EditAction =
  | { type: "START_EDIT"; payload: { adminNote: string; discount: number } }
  | { type: "CANCEL_EDIT" }
  | { type: "SET_NOTE"; payload: string }
  | { type: "SET_DISCOUNT"; payload: number };

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case "START_EDIT":
      return {
        isEditing: true,
        editAdminNote: action.payload.adminNote,
        editDiscount: action.payload.discount,
      };
    case "CANCEL_EDIT":
      return { ...state, isEditing: false };
    case "SET_NOTE":
      return { ...state, editAdminNote: action.payload };
    case "SET_DISCOUNT":
      return { ...state, editDiscount: action.payload };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Payment reducer
// ---------------------------------------------------------------------------

type PaymentState = { isOpen: boolean; amount: number; method: string; ref: string; note: string };
const initialPaymentState: PaymentState = {
  isOpen: false,
  amount: 0,
  method: PAYMENT_METHOD.CASH,
  ref: "",
  note: "",
};
type PaymentAction =
  | { type: "OPEN"; payload?: number }
  | { type: "CLOSE" }
  | { type: "SET_AMOUNT"; payload: number }
  | { type: "SET_METHOD"; payload: string }
  | { type: "SET_REF"; payload: string }
  | { type: "SET_NOTE"; payload: string };

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true, amount: action.payload ?? 0 };
    case "CLOSE":
      return { ...state, isOpen: false, ref: "", note: "" };
    case "SET_AMOUNT":
      return { ...state, amount: action.payload };
    case "SET_METHOD":
      return { ...state, method: action.payload };
    case "SET_REF":
      return { ...state, ref: action.payload };
    case "SET_NOTE":
      return { ...state, note: action.payload };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Invoice payload helper
// ---------------------------------------------------------------------------

function buildInvoicePayload(order: any) {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt ?? new Date(),
    customer: {
      fullName: order.customer?.fullName ?? "Khách lẻ",
      phone: order.customer?.phone,
      address: order.shippingAddress || order.customer?.address,
    },
    items: order.items.map((item: any) => ({
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal ?? 0,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total ?? 0,
    paidAmount: order.paidAmount,
    adminNote: order.adminNote,
  };
}

// ---------------------------------------------------------------------------
// History note translation (handles legacy English/technical entries)
// ---------------------------------------------------------------------------

const HISTORY_NOTE_FIELD_LABELS: Record<string, string> = {
  adminNote: "ghi chú admin",
  discount: "giảm giá",
  total: "tổng tiền",
  shippingName: "tên người nhận",
  shippingPhone: "SĐT giao hàng",
  shippingAddress: "địa chỉ giao hàng",
};

const HISTORY_NOTE_LITERALS: Record<string, string> = {
  "Order created by admin": "Tạo đơn hàng",
  "Stock out": "Đã xuất kho",
  "Order completed": "Hoàn tất đơn hàng",
  "Order cancelled": "Đã hủy đơn hàng",
};

/** Map legacy English/technical history notes to user-friendly Vietnamese. */
function translateHistoryNote(note: string): string {
  if (HISTORY_NOTE_LITERALS[note]) return HISTORY_NOTE_LITERALS[note];

  // Legacy: "Cập nhật đơn hàng: shippingName, shippingPhone, ..."
  const updateMatch = note.match(/^Cập nhật đơn hàng:\s*(.+)$/);
  if (updateMatch) {
    const fields = updateMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((k, _, arr) => !(k === "total" && arr.includes("discount")))
      .map((k) => HISTORY_NOTE_FIELD_LABELS[k] ?? k);
    return `Cập nhật ${fields.join(", ")}`;
  }

  // Legacy: "Payment recorded: 100000 (cash)"
  const paymentMatch = note.match(/^Payment recorded:\s*(\d+(?:\.\d+)?)\s*\((.+)\)$/);
  if (paymentMatch) {
    const amount = Number(paymentMatch[1]);
    const formatted = `${Math.round(amount).toLocaleString("vi-VN")}đ`;
    return `Ghi nhận thanh toán: ${formatted} (${paymentMatch[2]})`;
  }

  return note;
}

// ---------------------------------------------------------------------------
// PaymentDialog sub-component
// ---------------------------------------------------------------------------

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingAmount: number;
  paymentState: PaymentState;
  paymentDispatch: React.Dispatch<PaymentAction>;
  onSubmit: () => void;
  orderNumber: string | number;
  onTriggerClick: () => void;
}

function PaymentDialog({
  open,
  onOpenChange,
  remainingAmount,
  paymentState,
  paymentDispatch,
  onSubmit,
  orderNumber,
  onTriggerClick,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={onTriggerClick}
          className="gap-2 bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
        >
          <Banknote className="h-4 w-4" /> Thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          <DialogDescription>Tạo phiếu thu cho đơn hàng #{orderNumber}.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="py-4">
          <Field>
            <FieldLabel>Số tiền thanh toán</FieldLabel>
            <NumberInput
              value={paymentState.amount}
              onValueChange={(values) =>
                paymentDispatch({ type: "SET_AMOUNT", payload: values.floatValue ?? 0 })
              }
              max={remainingAmount}
            />
            <FieldDescription>Còn nợ: {formatCurrency(remainingAmount)}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Phương thức</FieldLabel>
            <RadioGroup
              value={paymentState.method}
              onValueChange={(v) => paymentDispatch({ type: "SET_METHOD", payload: v })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PAYMENT_METHOD.CASH} id="cash" />
                <FieldLabel htmlFor="cash">{PAYMENT_METHOD_LABEL[PAYMENT_METHOD.CASH]}</FieldLabel>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PAYMENT_METHOD.BANK_TRANSFER} id="bank" />
                <FieldLabel htmlFor="bank">
                  {PAYMENT_METHOD_LABEL[PAYMENT_METHOD.BANK_TRANSFER]}
                </FieldLabel>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PAYMENT_METHOD.CARD} id="card" />
                <FieldLabel htmlFor="card">{PAYMENT_METHOD_LABEL[PAYMENT_METHOD.CARD]}</FieldLabel>
              </div>
            </RadioGroup>
          </Field>
          {paymentState.method === PAYMENT_METHOD.BANK_TRANSFER && (
            <Field>
              <FieldLabel>Mã tham chiếu (Mã GD)</FieldLabel>
              <Input
                placeholder="VD: FT2332..."
                value={paymentState.ref}
                onChange={(e) => paymentDispatch({ type: "SET_REF", payload: e.target.value })}
              />
            </Field>
          )}
          <Field>
            <FieldLabel>Ghi chú</FieldLabel>
            <Input
              placeholder="Ghi chú nội bộ..."
              value={paymentState.note}
              onChange={(e) => paymentDispatch({ type: "SET_NOTE", payload: e.target.value })}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => paymentDispatch({ type: "CLOSE" })}>
            Hủy
          </Button>
          <Button onClick={onSubmit} className="bg-emerald-600 font-bold hover:bg-emerald-700">
            Lưu thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page entry point
// ---------------------------------------------------------------------------

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
  const queryClient = useQueryClient();

  // Data Fetching
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => adminClient.getOrder(id),
  });

  const order = data?.order;

  // Local State
  const [note, setNote] = useState("");
  const [editState, editDispatch] = useReducer(editReducer, initialEditState);
  const [paymentState, paymentDispatch] = useReducer(paymentReducer, initialPaymentState);
  const [isCustomerEditOpen, setIsCustomerEditOpen] = useState(false);
  const [isCustomerEditSubmitting, setIsCustomerEditSubmitting] = useState(false);

  // Item editing state (only active for pending orders)
  type EditableItem = {
    variantId: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    customPrice: number;
  };
  const [isItemEditing, setIsItemEditing] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [isSavingItems, setIsSavingItems] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditCustomer = async (formData: FormData) => {
    const customerId = formData.get("id") as string;
    if (!customerId) return;
    setIsCustomerEditSubmitting(true);
    const payload = {
      fullName: (formData.get("fullName") as string) ?? undefined,
      phone: (formData.get("phone") as string) ?? undefined,
      address: (formData.get("address") as string) ?? undefined,
      customerType: (formData.get("customerType") as string) ?? undefined,
    };
    try {
      await adminClient.updateCustomer(customerId, payload);
      toast.success("Đã cập nhật thông tin khách hàng");
      setIsCustomerEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra");
    } finally {
      setIsCustomerEditSubmitting(false);
    }
  };

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

  const paymentStatus = order.paymentStatus as PaymentStatusValue;
  const fulfillmentStatus = order.fulfillmentStatus as FulfillmentStatusValue;
  const isTerminal = fulfillmentStatus === "completed" || fulfillmentStatus === "cancelled";
  const canDelete = fulfillmentStatus === "cancelled";
  const canEditItems =
    fulfillmentStatus === "pending" &&
    !order.parentOrderId &&
    !((order.subOrders?.length ?? 0) > 0);

  // Handlers
  const handleOpenPayment = () => {
    paymentDispatch({ type: "OPEN", payload: remainingAmount });
  };

  const handleRecordPayment = async () => {
    if (paymentState.amount <= 0) return;

    const referenceCode = paymentState.ref || undefined;
    const noteValue = paymentState.note || undefined;

    try {
      await adminClient.recordOrderPayment(order.id, {
        amount: paymentState.amount,
        method: paymentState.method,
        referenceCode: referenceCode,
        note: noteValue,
      });
      toast.success("Đã ghi nhận thanh toán.");
      paymentDispatch({ type: "CLOSE" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  };

  const handleStockOut = async () => {
    try {
      await adminClient.stockOutOrder(order.id, { note: note || undefined });
      toast.success("Đã xuất kho đơn hàng.");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  };

  const handleComplete = async () => {
    try {
      await adminClient.completeOrder(order.id, { note: note || undefined });
      toast.success("Đã hoàn tất đơn hàng.");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  };

  const handleCancel = async () => {
    try {
      await adminClient.cancelOrder(order.id, { note: note || undefined });
      toast.success("Đã hủy đơn hàng.");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await adminClient.updateOrder(order.id, {
        adminNote: editState.editAdminNote,
        discount: editState.editDiscount,
      });
      toast.success("Cập nhật đơn hàng thành công");
      editDispatch({ type: "CANCEL_EDIT" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  };

  const handleSaveShipping = async (payload: {
    shippingName: string | null;
    shippingPhone: string | null;
    shippingAddress: string | null;
  }) => {
    try {
      await adminClient.updateOrder(order.id, payload);
      toast.success("Đã cập nhật địa chỉ giao hàng");
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra";
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleStartItemEdit = () => {
    setEditableItems(
      (order?.items ?? []).map((item: any) => ({
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        quantity: item.quantity,
        customPrice: Number(item.unitPrice),
      })),
    );
    setIsItemEditing(true);
  };

  const handleAddVariantToEdit = (variant: OrderProductVariant, product: OrderProductSelection) => {
    setEditableItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          quantity: 1,
          customPrice: Number(variant.price),
        },
      ];
    });
  };

  const handleSaveItems = async () => {
    if (editableItems.length === 0) return;
    setIsSavingItems(true);
    try {
      await adminClient.updateOrder(order!.id, {
        items: editableItems.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          customPrice: i.customPrice,
        })),
      });
      toast.success("Đã cập nhật sản phẩm đơn hàng.");
      setIsItemEditing(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra");
    } finally {
      setIsSavingItems(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminClient.deleteOrder(order.id);
      router.push("/orders?deleted=true");
      toast.success("Đã xóa đơn hàng");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
            <Link href="/orders">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
              #{order.orderNumber}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge type={paymentStatus as StatusType} />
              <StatusBadge type={fulfillmentStatus as StatusType} />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 sm:text-sm">
              <Clock className="h-3 w-3 shrink-0" /> Tạo lúc: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 [&_button]:h-8 [&_button]:px-3 [&_button]:text-xs md:justify-end md:gap-2.5 sm:[&_button]:h-9 sm:[&_button]:px-4 sm:[&_button]:text-sm lg:flex-nowrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="group gap-2 font-bold">
                <Printer className="h-4 w-4" /> Xuất hóa đơn{" "}
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[var(--radix-dropdown-menu-trigger-width)] p-1"
            >
              <DropdownMenuItem
                className="group cursor-pointer gap-2 rounded-md px-2 py-1.5 text-sm font-medium data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground"
                onClick={async () =>
                  copyInvoiceImage(buildInvoicePayload(order), await getShopInfo())
                }
              >
                <span className="bg-primary/10 text-primary group-data-[highlighted]:bg-primary-foreground/20 group-data-[highlighted]:text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                  <Copy className="h-3.5 w-3.5" />
                </span>
                Sao chép
              </DropdownMenuItem>
              <DropdownMenuItem
                className="group cursor-pointer gap-2 rounded-md px-2 py-1.5 text-sm font-medium data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground"
                onClick={async () =>
                  exportInvoiceImage(buildInvoicePayload(order), await getShopInfo())
                }
              >
                <span className="bg-primary/10 text-primary group-data-[highlighted]:bg-primary-foreground/20 group-data-[highlighted]:text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                  <FileImage className="h-3.5 w-3.5" />
                </span>
                Xuất file ảnh
              </DropdownMenuItem>
              <DropdownMenuItem
                className="group cursor-pointer gap-2 rounded-md px-2 py-1.5 text-sm font-medium data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground"
                onClick={async () => printInvoice(buildInvoicePayload(order), await getShopInfo())}
              >
                <span className="bg-primary/10 text-primary group-data-[highlighted]:bg-primary-foreground/20 group-data-[highlighted]:text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                Xuất file PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {fulfillmentStatus === "pending" && (
            <>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg"
                onClick={handleStockOut}
              >
                Xuất kho
              </Button>
              <Button
                variant="destructive"
                className="font-bold shadow-lg"
                onClick={() => setShowCancelConfirm(true)}
              >
                Hủy đơn
              </Button>
              {paymentStatus !== "paid" && (
                <PaymentDialog
                  open={paymentState.isOpen}
                  onOpenChange={(open) => {
                    if (!open) paymentDispatch({ type: "CLOSE" });
                  }}
                  remainingAmount={remainingAmount}
                  paymentState={paymentState}
                  paymentDispatch={paymentDispatch}
                  onSubmit={handleRecordPayment}
                  orderNumber={order.orderNumber}
                  onTriggerClick={handleOpenPayment}
                />
              )}
            </>
          )}
          {fulfillmentStatus === "stock_out" && paymentStatus !== "paid" && (
            <PaymentDialog
              open={paymentState.isOpen}
              onOpenChange={(open) => {
                if (!open) paymentDispatch({ type: "CLOSE" });
              }}
              remainingAmount={remainingAmount}
              paymentState={paymentState}
              paymentDispatch={paymentDispatch}
              onSubmit={handleRecordPayment}
              orderNumber={order.orderNumber}
              onTriggerClick={handleOpenPayment}
            />
          )}
          {fulfillmentStatus === "stock_out" && paymentStatus === "paid" && (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg"
              onClick={handleComplete}
            >
              Hoàn tất đơn
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Info */}
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          {/* Parent Order Link (if child) */}
          {order.parentOrder && (
            <Card className="border-blue-100 bg-blue-50/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-blue-900">Đơn hàng được tách từ đơn gốc</div>
                  <Link
                    href={`/orders/${order.parentOrder.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Xem đơn gốc #{order.parentOrder.orderNumber}
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-orders (if parent) */}
          {order.subOrders && order.subOrders.length > 0 && (
            <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
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
                    className="hover:border-primary/50 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg border border-slate-100 bg-white p-2">
                        <Package className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <Link
                          href={`/orders/${sub.id}`}
                          className="hover:text-primary font-black text-slate-900 hover:underline"
                        >
                          #{sub.orderNumber}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="bg-white text-xs">
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
                    <div className="flex flex-col items-end gap-1">
                      {PAYMENT_BADGE[sub.paymentStatus as PaymentStatusValue] && (
                        <Badge
                          className={`${PAYMENT_BADGE[sub.paymentStatus as PaymentStatusValue].className} border px-2 py-0.5 text-xs font-bold uppercase`}
                        >
                          {PAYMENT_BADGE[sub.paymentStatus as PaymentStatusValue].label}
                        </Badge>
                      )}
                      {FULFILLMENT_BADGE[sub.fulfillmentStatus as FulfillmentStatusValue] && (
                        <Badge
                          className={`${FULFILLMENT_BADGE[sub.fulfillmentStatus as FulfillmentStatusValue].className} border px-2 py-0.5 text-xs font-bold uppercase`}
                        >
                          {FULFILLMENT_BADGE[sub.fulfillmentStatus as FulfillmentStatusValue].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="gap-0 border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                <Package className="text-primary h-5 w-5" /> Chi tiết sản phẩm
              </CardTitle>
              {canEditItems && !isItemEditing && (
                <Button variant="outline" size="sm" onClick={handleStartItemEdit} className="gap-1">
                  <Edit2 className="h-3.5 w-3.5" /> Sửa
                </Button>
              )}
              {isItemEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsItemEditing(false)}
                    disabled={isSavingItems}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveItems}
                    disabled={isSavingItems || editableItems.length === 0}
                  >
                    {isSavingItems && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                    Lưu
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isItemEditing && (
                <div className="border-b border-slate-100 px-4 py-4">
                  <OrderAddRow onAddItem={handleAddVariantToEdit} />
                </div>
              )}
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[46%] pl-4 sm:w-[50%] sm:pl-6">Sản phẩm</TableHead>
                    <TableHead className="w-[12%] text-center">SL</TableHead>
                    <TableHead className="w-[20%] text-right">Đơn giá</TableHead>
                    <TableHead className="w-[22%] pr-4 text-right sm:pr-6">Tổng</TableHead>
                    {isItemEditing && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isItemEditing ? editableItems : order.items).map((item: any, idx: number) => (
                    <TableRow key={isItemEditing ? item.variantId : item.id}>
                      <TableCell className="!whitespace-normal align-top">
                        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                          {!isItemEditing && item.variant?.images?.[0] ? (
                            <Image
                              src={item.variant.images[0].imageUrl}
                              alt={`${formatVariantDisplayName(item.productName)} - ${formatVariantDisplayName(item.variantName)}`}
                              width={48}
                              height={48}
                              className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 object-contain sm:h-12 sm:w-12"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-12 sm:w-12">
                              <ShoppingBag className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div
                              className="line-clamp-2 text-sm font-bold break-words text-slate-900"
                              title={formatVariantDisplayName(item.productName)}
                            >
                              {formatVariantDisplayName(item.productName)}
                            </div>
                            <div
                              className="line-clamp-1 font-mono text-xs break-all text-slate-500"
                              title={formatVariantDisplayName(item.variantName)}
                            >
                              {formatVariantDisplayName(item.variantName)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isItemEditing ? (
                          <NumberInput
                            decimalScale={0}
                            min={1}
                            value={item.quantity}
                            onValueChange={({ floatValue }) => {
                              const qty = Math.max(1, floatValue ?? 1);
                              setEditableItems((prev) =>
                                prev.map((ei, i) => (i === idx ? { ...ei, quantity: qty } : ei)),
                              );
                            }}
                            className="w-16 text-center"
                          />
                        ) : (
                          <span className="font-bold">{item.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isItemEditing ? (
                          <NumberInput
                            decimalScale={0}
                            min={0}
                            value={item.customPrice}
                            onValueChange={({ floatValue }) => {
                              const price = Math.max(0, floatValue ?? 0);
                              setEditableItems((prev) =>
                                prev.map((ei, i) =>
                                  i === idx ? { ...ei, customPrice: price } : ei,
                                ),
                              );
                            }}
                            className="w-28 text-right"
                          />
                        ) : (
                          <span className="font-medium text-slate-600">
                            {formatCurrency(Number(item.unitPrice))}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {isItemEditing
                          ? formatCurrency(item.customPrice * item.quantity)
                          : formatCurrency(Number(item.lineTotal))}
                      </TableCell>
                      {isItemEditing && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-600"
                            onClick={() =>
                              setEditableItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-col items-stretch gap-1.5 border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:items-end sm:px-6 sm:py-5">
                <div className="flex w-full justify-between text-sm font-medium text-slate-500 sm:max-w-xs">
                  <span>Tạm tính</span>
                  <span className="tabular-nums">
                    {isItemEditing
                      ? formatCurrency(
                          editableItems.reduce((s, i) => s + i.customPrice * i.quantity, 0),
                        )
                      : formatCurrency(Number(order.subtotal))}
                  </span>
                </div>
                {Number(order.shippingFee || 0) > 0 && (
                  <div className="flex w-full justify-between text-sm font-medium text-slate-500 sm:max-w-xs">
                    <span>Phí ship trả hộ</span>
                    <span className="tabular-nums">
                      {formatCurrency(Number(order.shippingFee))}
                    </span>
                  </div>
                )}
                <div className="flex w-full items-baseline justify-between text-lg font-black text-slate-900 sm:max-w-xs sm:text-xl">
                  <span>Tổng cộng</span>
                  <span className="text-primary tabular-nums">
                    {isItemEditing
                      ? formatCurrency(
                          editableItems.reduce((s, i) => s + i.customPrice * i.quantity, 0) +
                            Number(order.shippingFee || 0),
                        )
                      : formatCurrency(Number(order.total))}
                  </span>
                </div>
                <div className="mt-2 w-full border-t border-slate-200 pt-2 sm:max-w-xs">
                  <div className="flex w-full justify-between text-sm font-medium text-emerald-600">
                    <span>Đã thanh toán</span>
                    <span className="tabular-nums">
                      {formatCurrency(Number(order.paidAmount || 0))}
                    </span>
                  </div>
                  <div className="mt-1 flex w-full justify-between text-sm font-bold text-red-500">
                    <span>Còn lại</span>
                    <span className="tabular-nums">
                      {formatCurrency(
                        Math.max(0, Number(order.total) - Number(order.paidAmount || 0)),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {order.payments && order.payments.length > 0 && (
            <Card className="gap-0 border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                  <Wallet className="h-5 w-5 text-emerald-600" /> Lịch sử thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
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
                            <Badge variant="outline" className="text-xs uppercase">
                              {PAYMENT_METHOD_LABEL[p.method as PaymentMethodValue] ?? p.method}
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Note Input (Only if not terminal) */}
          {!isTerminal && (
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardContent className="px-6">
                <Field>
                  <FieldLabel htmlFor="order-status-note">Ghi chú cập nhật (tùy chọn)</FieldLabel>
                  <FieldDescription>
                    Ghi chú này sẽ được lưu vào lịch sử khi bạn nhấn một trong các nút cập nhật
                    trạng thái ở trên (ví dụ: "Xuất kho", "Hoàn tất đơn", "Hủy đơn").
                  </FieldDescription>
                  <Input
                    id="order-status-note"
                    placeholder="Nhập ghi chú cho lần cập nhật trạng thái này..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card className="gap-0 border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
                <Clock className="h-5 w-5 text-slate-500" /> Lịch sử trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="relative ml-3 space-y-6 border-l-2 border-slate-100 py-2 pl-4 sm:ml-6 sm:space-y-8 sm:pl-6">
              {order.statusHistory.map((history: any) => {
                const historyPayment = PAYMENT_BADGE[history.paymentStatus as PaymentStatusValue];
                const historyFulfillment =
                  FULFILLMENT_BADGE[history.fulfillmentStatus as FulfillmentStatusValue];
                return (
                  <div key={history.id} className="relative">
                    <div className="absolute top-1 -left-5.5 h-4 w-4 rounded-full border-2 border-white bg-slate-400 sm:-left-8"></div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {historyPayment && (
                          <Badge
                            className={`${historyPayment.className} border px-2 py-0.5 text-xs font-bold uppercase`}
                          >
                            {historyPayment.label}
                          </Badge>
                        )}
                        {historyFulfillment && (
                          <Badge
                            className={`${historyFulfillment.className} border px-2 py-0.5 text-xs font-bold uppercase`}
                          >
                            {historyFulfillment.label}
                          </Badge>
                        )}
                        <span className="ml-auto font-mono text-xs font-normal text-slate-400">
                          {formatDate(history.createdAt)}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        Cập nhật bởi: {history.creator?.fullName || "Admin"}
                      </span>
                      {history.note && (
                        <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600 italic">
                          "{translateHistoryNote(history.note)}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer & Meta */}
        <div className="space-y-4 lg:col-span-1 lg:space-y-6">
          <CustomerEditSheet
            isOpen={isCustomerEditOpen}
            onOpenChange={setIsCustomerEditOpen}
            customer={order.customer}
            isSubmitting={isCustomerEditSubmitting}
            onSubmit={handleEditCustomer}
          />
          <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg font-black tracking-tight uppercase">
                <span className="flex items-center gap-2">
                  <User className="text-primary h-5 w-5" /> Khách hàng
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsCustomerEditOpen(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={order.customer.avatarUrl || undefined} />
                  <AvatarFallback>{order.customer.fullName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-black text-slate-900">{order.customer.fullName}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    {order.customer.customerCode}
                  </div>
                </div>
              </div>
              <Separator />
              <OrderShippingSection
                order={{
                  shippingName: order.shippingName ?? null,
                  shippingPhone: order.shippingPhone ?? null,
                  shippingAddress: order.shippingAddress ?? null,
                }}
                customer={{
                  fullName: order.customer.fullName,
                  phone: order.customer.phone ?? null,
                  address: order.customer.address ?? null,
                }}
                canEdit={fulfillmentStatus === "pending"}
                onSave={handleSaveShipping}
              />
              <Separator />
              <div className="space-y-3 text-sm font-medium text-slate-600">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Hồ sơ khách
                </div>
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
              {editState.isEditing ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="adminNote">Ghi chú admin</FieldLabel>
                    <Textarea
                      id="adminNote"
                      value={editState.editAdminNote}
                      onChange={(e) => editDispatch({ type: "SET_NOTE", payload: e.target.value })}
                      placeholder="Nhập ghi chú..."
                      className="min-h-20"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="discount">Giảm giá (VND)</FieldLabel>
                    <NumberInput
                      id="discount"
                      value={editState.editDiscount}
                      onValueChange={(values) =>
                        editDispatch({ type: "SET_DISCOUNT", payload: values.floatValue ?? 0 })
                      }
                      placeholder="0"
                      decimalScale={0}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="flex-1 font-bold">
                      Lưu
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => editDispatch({ type: "CANCEL_EDIT" })}
                      className="flex-1 font-bold"
                    >
                      Hủy
                    </Button>
                  </div>
                </FieldGroup>
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
                    onClick={() =>
                      editDispatch({
                        type: "START_EDIT",
                        payload: {
                          adminNote: order.adminNote || "",
                          discount: order.discount ? Number(order.discount) : 0,
                        },
                      })
                    }
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
              className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDeleteConfirm(true)}
              data-testid="delete-order-button"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Xóa đơn hàng
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Bạn có chắc chắn muốn hủy đơn hàng này?"
        confirmLabel="Hủy đơn"
        onConfirm={() => {
          setShowCancelConfirm(false);
          handleCancel();
        }}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Bạn có chắc chắn muốn xóa đơn hàng này không?"
        confirmLabel="Xóa đơn"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDelete();
        }}
      />
    </div>
  );
}
