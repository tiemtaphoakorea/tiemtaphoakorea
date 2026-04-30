# Quick Bulk Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin to select multiple orders in the orders list and pay all remaining balances at once via a single payment method.

**Architecture:** Add checkbox selection state to `orders/page.tsx`, pass selected orders to `OrderToolbar` which shows a "Thanh toán nhanh" button, clicking it opens a new `QuickPaymentDialog` that loops through eligible orders calling `recordOrderPayment` for each.

**Tech Stack:** Next.js (App Router), React Query (`useQueryClient` + `invalidateQueries`), sonner toasts, TanStack Table `ColumnDef`, plain HTML checkboxes (`accent-primary`), Radix UI Select/Dialog.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/admin/app/(dashboard)/orders/page.tsx` | Modify | Selection state, checkbox column, pass selectedOrders to toolbar |
| `apps/admin/components/admin/orders/order-toolbar.tsx` | Modify | Accept selectedOrders prop, show quick-pay button, own dialog open state |
| `apps/admin/components/admin/orders/quick-payment-dialog.tsx` | Create | Dialog UI, eligibility calc, payment loop, toasts |

---

## Task 1: Add selection state and checkbox column to `orders/page.tsx`

**Files:**
- Modify: `apps/admin/app/(dashboard)/orders/page.tsx`

- [ ] **Step 1: Add `selectedIds` state and helper functions**

  In `AdminOrdersContent`, after the existing `useState` calls, add:

  ```tsx
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? orders.map((o) => o.id) : []);
  };
  ```

- [ ] **Step 2: Clear selection when page changes**

  Add a `useEffect` after the existing effects:

  ```tsx
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);
  ```

- [ ] **Step 3: Add checkbox column as first entry in `columns`**

  Before the `orderNumber` column definition, insert:

  ```tsx
  {
    id: "select",
    header: () => (
      <input
        type="checkbox"
        checked={orders.length > 0 && orders.every((o) => selectedIds.includes(o.id))}
        ref={(el) => {
          if (el) {
            const some = orders.some((o) => selectedIds.includes(o.id));
            const all = orders.length > 0 && orders.every((o) => selectedIds.includes(o.id));
            el.indeterminate = some && !all;
          }
        }}
        onChange={(e) => toggleSelectAll(e.target.checked)}
        aria-label="Chọn tất cả"
        className="h-4 w-4 cursor-pointer accent-primary"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedIds.includes(row.original.id)}
        onChange={() => toggleSelect(row.original.id)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Chọn đơn ${row.original.orderNumber}`}
        className="h-4 w-4 cursor-pointer accent-primary"
      />
    ),
  },
  ```

- [ ] **Step 4: Compute `selectedOrders` and update `OrderToolbar` call**

  Add before the `return` statement:

  ```tsx
  const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
  ```

  Then update the `<OrderToolbar ... />` call to pass two new props:

  ```tsx
  <OrderToolbar
    searchTerm={searchInput}
    onSearchChange={handleSearch}
    paymentStatus={paymentStatusFilter}
    onPaymentStatusChange={handlePaymentStatusChange}
    fulfillmentStatus={fulfillmentStatusFilter}
    onFulfillmentStatusChange={handleFulfillmentStatusChange}
    debtOnly={debtOnly}
    onDebtOnlyToggle={handleDebtOnlyToggle}
    paymentBadge={PAYMENT_BADGE}
    fulfillmentBadge={FULFILLMENT_BADGE}
    selectedOrders={selectedOrders}
    onQuickPaymentSuccess={() => setSelectedIds([])}
  />
  ```

- [ ] **Step 5: Verify the page compiles without TypeScript errors**

  ```bash
  cd /path/to/auth_shop_platform
  pnpm --filter @workspace/admin exec tsc --noEmit
  ```

  Expected: TypeScript errors only for the new props not yet defined in `OrderToolbarProps` (will fix in Task 2). No other errors.

- [ ] **Step 6: Commit**

  ```bash
  git add apps/admin/app/(dashboard)/orders/page.tsx
  git commit -m "feat(orders): add row selection state and checkbox column"
  ```

---

## Task 2: Update `OrderToolbar` to show quick payment button

**Files:**
- Modify: `apps/admin/components/admin/orders/order-toolbar.tsx`

- [ ] **Step 1: Add new props to `OrderToolbarProps` interface**

  Add to the existing interface (after `fulfillmentBadge`):

  ```tsx
  selectedOrders?: AdminOrderListItem[];
  onQuickPaymentSuccess?: () => void;
  ```

  Add the import at the top of the file:

  ```tsx
  import type { AdminOrderListItem } from "@workspace/database/types/admin";
  ```

- [ ] **Step 2: Destructure new props in the function signature**

  ```tsx
  export function OrderToolbar({
    searchTerm,
    onSearchChange,
    paymentStatus,
    onPaymentStatusChange,
    fulfillmentStatus,
    onFulfillmentStatusChange,
    debtOnly,
    onDebtOnlyToggle,
    paymentBadge,
    fulfillmentBadge,
    selectedOrders = [],
    onQuickPaymentSuccess,
  }: OrderToolbarProps) {
  ```

- [ ] **Step 3: Add `dialogOpen` state**

  At the top of the function body, before the `return`:

  ```tsx
  const [dialogOpen, setDialogOpen] = useState(false);
  ```

  Add `useState` to the React import at the top of the file:

  ```tsx
  import { useState } from "react";
  ```

- [ ] **Step 4: Add "Thanh toán nhanh" button to the toolbar**

  Inside the `<div className="flex flex-wrap items-center gap-3">` (after the "Công nợ" button), add:

  ```tsx
  {selectedOrders.length > 0 && (
    <Button
      className="h-10 gap-2 font-bold"
      onClick={() => setDialogOpen(true)}
    >
      Thanh toán nhanh ({selectedOrders.length})
    </Button>
  )}
  ```

- [ ] **Step 5: Add `QuickPaymentDialog` below the return's root div**

  Import the dialog at the top of the file:

  ```tsx
  import { QuickPaymentDialog } from "./quick-payment-dialog";
  ```

  Then, just before the closing `</div>` of the root element:

  ```tsx
  <QuickPaymentDialog
    open={dialogOpen}
    onOpenChange={setDialogOpen}
    selectedOrders={selectedOrders}
    onSuccess={() => {
      setDialogOpen(false);
      onQuickPaymentSuccess?.();
    }}
  />
  ```

- [ ] **Step 6: Verify TypeScript compiles**

  ```bash
  pnpm --filter @workspace/admin exec tsc --noEmit
  ```

  Expected: only errors for `QuickPaymentDialog` not yet defined (will fix in Task 3).

- [ ] **Step 7: Commit**

  ```bash
  git add apps/admin/components/admin/orders/order-toolbar.tsx
  git commit -m "feat(orders): add quick payment button to toolbar when orders selected"
  ```

---

## Task 3: Create `QuickPaymentDialog`

**Files:**
- Create: `apps/admin/components/admin/orders/quick-payment-dialog.tsx`

- [ ] **Step 1: Create the file with imports and types**

  ```tsx
  "use client";

  import type { AdminOrderListItem } from "@workspace/database/types/admin";
  import { PAYMENT_METHOD } from "@workspace/shared/constants";
  import { formatCurrency } from "@workspace/shared/utils";
  import { Button } from "@workspace/ui/components/button";
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@workspace/ui/components/dialog";
  import { Label } from "@workspace/ui/components/label";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@workspace/ui/components/select";
  import { useQueryClient } from "@tanstack/react-query";
  import { useState } from "react";
  import { toast } from "sonner";
  import { adminClient } from "@/services/admin.client";

  interface QuickPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedOrders: AdminOrderListItem[];
    onSuccess: () => void;
  }
  ```

- [ ] **Step 2: Implement the component**

  ```tsx
  export function QuickPaymentDialog({
    open,
    onOpenChange,
    selectedOrders,
    onSuccess,
  }: QuickPaymentDialogProps) {
    const queryClient = useQueryClient();
    const [method, setMethod] = useState<string>(PAYMENT_METHOD.BANK_TRANSFER);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const eligibleOrders = selectedOrders.filter(
      (o) => o.paymentStatus === "unpaid" || o.paymentStatus === "partial",
    );
    const ineligibleCount = selectedOrders.length - eligibleOrders.length;
    const totalPayable = eligibleOrders.reduce(
      (sum, o) => sum + (Number(o.total) - Number(o.paidAmount)),
      0,
    );

    const handleOpenChange = (next: boolean) => {
      if (isSubmitting) return;
      onOpenChange(next);
    };

    const handleConfirm = async () => {
      if (eligibleOrders.length === 0 || isSubmitting) return;
      setIsSubmitting(true);
      let successCount = 0;
      try {
        for (const order of eligibleOrders) {
          const amount = Number(order.total) - Number(order.paidAmount);
          await adminClient.recordOrderPayment(order.id, { amount, method });
          successCount += 1;
        }
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        toast.success("Thanh toán thành công", {
          description: `Đã ghi nhận thanh toán cho ${successCount} đơn hàng.`,
        });
        onSuccess();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Có lỗi xảy ra khi ghi nhận thanh toán.";
        toast.error("Lỗi thanh toán", { description: message });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Thanh toán nhanh đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Chọn phương thức thanh toán</Label>
              <Select value={method} onValueChange={setMethod} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PAYMENT_METHOD.CASH}>Tiền mặt</SelectItem>
                  <SelectItem value={PAYMENT_METHOD.BANK_TRANSFER}>Chuyển khoản</SelectItem>
                  <SelectItem value={PAYMENT_METHOD.CARD}>Quẹt thẻ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex justify-between text-sm">
                <span>Số đơn đủ điều kiện:</span>
                <span className="font-bold">{eligibleOrders.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Số đơn không đủ điều kiện:</span>
                <span className={`font-bold ${ineligibleCount > 0 ? "text-red-500" : ""}`}>
                  {ineligibleCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tổng tiền có thể thanh toán:</span>
                <span className="font-bold">{formatCurrency(totalPayable)}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 italic">
              Lưu ý: Hệ thống sẽ thanh toán lần lượt các đơn và tạo ra nhiều phiếu thu tương ứng
              với số lượng đơn hàng cần thanh toán.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Thoát
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || eligibleOrders.length === 0}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

  ```bash
  pnpm --filter @workspace/admin exec tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/admin/components/admin/orders/quick-payment-dialog.tsx
  git commit -m "feat(orders): add QuickPaymentDialog for bulk order payment"
  ```

---

## Task 4: Manual smoke test

- [ ] **Step 1: Start the dev server**

  ```bash
  pnpm --filter @workspace/admin dev
  ```

- [ ] **Step 2: Navigate to `/orders` and verify checkboxes appear**

  Each row should have a checkbox in the first column. The header checkbox should select/deselect all on the current page.

- [ ] **Step 3: Select 1+ unpaid/partial orders and verify the button appears**

  "Thanh toán nhanh (N)" button should appear in the toolbar.

- [ ] **Step 4: Open dialog and verify stats are correct**

  - Eligible count = number of selected orders with `paymentStatus` unpaid or partial
  - Ineligible count = remaining (in red if > 0)
  - Total = sum of `total - paidAmount` for eligible orders

- [ ] **Step 5: Confirm and verify success**

  - Toast appears: "Đã ghi nhận thanh toán cho N đơn hàng."
  - Dialog closes
  - Checkboxes deselect
  - Order list refreshes (paid orders show updated payment status)

- [ ] **Step 6: Test error case** (optional)

  Select an order then network-throttle / block the API to verify the error toast names the failed order correctly.
