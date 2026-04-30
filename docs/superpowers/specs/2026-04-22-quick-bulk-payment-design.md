# Thanh toán nhanh đơn hàng (Quick Bulk Payment)

**Date:** 2026-04-22  
**Status:** Approved

## Overview

Admin có thể chọn nhiều đơn hàng trong trang danh sách đơn và thanh toán toàn bộ số tiền còn lại của từng đơn cùng một lúc, với một phương thức thanh toán chung.

## Requirements

- Chọn ≥1 đơn → nút "Thanh toán nhanh" xuất hiện trong `OrderToolbar`
- Điều kiện đủ thanh toán: `paymentStatus === 'unpaid' | 'partial'`
- Mỗi đơn đủ điều kiện được ghi nhận đủ số tiền còn lại: `total - paidAmount`
- Một phương thức thanh toán duy nhất cho tất cả đơn
- Không cần nhập số tiền — hệ thống tự tính

## Architecture

### Files Modified

| File | Change |
|------|--------|
| `apps/admin/app/(dashboard)/orders/page.tsx` | Add `selectedIds` state, checkbox column, pass `selectedOrders` to toolbar |
| `apps/admin/components/admin/orders/order-toolbar.tsx` | Accept `selectedOrders` prop, show "Thanh toán nhanh" button conditionally |

### Files Created

| File | Purpose |
|------|---------|
| `apps/admin/components/admin/orders/quick-payment-dialog.tsx` | Confirmation dialog matching mockup |

### Data Flow

```
page.tsx
  ├── selectedIds: string[]          ← useState
  ├── orders: AdminOrderListItem[]   ← from React Query
  │
  ├── checkbox column  →  toggle selectedIds
  ├── OrderToolbar
  │     ├── selectedOrders = orders.filter(o => selectedIds.includes(o.id))
  │     └── QuickPaymentDialog
  │           ├── eligibleOrders = selectedOrders.filter(paymentStatus unpaid|partial)
  │           ├── ineligibleCount = selectedOrders.length - eligibleOrders.length
  │           ├── totalPayable = sum(order.total - order.paidAmount) for eligible
  │           └── on confirm: loop recordOrderPayment() for each eligible order
  └── on success → invalidate orders query + clear selectedIds
```

## Component Designs

### Checkbox Column (in `page.tsx`)

Added as first column in the `columns` array:

```typescript
{
  id: "select",
  header: ({ /* all orders on page */ }) => (
    <Checkbox
      checked={allOnPageSelected}
      onCheckedChange={toggleSelectAll}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={selectedIds.includes(row.original.id)}
      onCheckedChange={() => toggleSelect(row.original.id)}
    />
  ),
}
```

Selection state cleared on page change via `useEffect`.

### OrderToolbar Changes

New optional props:
```typescript
selectedOrders?: AdminOrderListItem[]
onQuickPaymentSuccess?: () => void
```

Button renders only when `selectedOrders.length > 0`:
```tsx
{selectedOrders && selectedOrders.length > 0 && (
  <Button onClick={() => setDialogOpen(true)}>
    Thanh toán nhanh ({selectedOrders.length})
  </Button>
)}
```

Dialog state (`dialogOpen`) lives inside `OrderToolbar`.

### QuickPaymentDialog

```typescript
interface QuickPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOrders: AdminOrderListItem[]
  onSuccess: () => void
}
```

**UI elements:**
- Dropdown: Phương thức thanh toán (Tiền mặt / Chuyển khoản)
- Stats row: Số đơn đủ điều kiện
- Stats row: Số đơn không đủ điều kiện (red if > 0)
- Stats row: Tổng tiền có thể thanh toán
- Italic note: "Hệ thống sẽ thanh toán lần lượt các đơn và tạo ra nhiều phiếu thu tương ứng với số lượng đơn hàng cần thanh toán."
- Buttons: Thoát / Xác nhận

**Payment processing:**
```
for each eligibleOrder (sorted by stockOutAt FIFO):
  await adminClient.recordOrderPayment(order.id, {
    amount: order.total - order.paidAmount,
    method
  })
  // stop on first error, show which order failed via toast
```

**On success:** close dialog → `queryClient.invalidateQueries` orders list → `onSuccess()` clears selectedIds → success toast

**On error:** error toast naming the failed order number, dialog stays open, selection preserved for retry

## Error Handling

- All ineligible orders (already paid / cancelled): shown as count in dialog — user can still confirm for eligible ones
- If ALL selected orders are ineligible: Xác nhận button disabled
- Network error mid-loop: stop immediately, toast with order number that failed
- API validation error: same as network error

## What is NOT in scope

- Reference code / note input per payment (not in mockup)
- Cross-page selection (selection clears on page change)
- Undo / rollback after partial success
