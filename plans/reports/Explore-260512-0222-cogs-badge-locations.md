# UI Cost/COGS Badge Locations - Exploration Report

## Summary
Found **3 primary order display locations** where "Giá vốn tạm tính" badge should be added. All components are `fulfillmentStatus` aware. Schema confirms `costPriceAtOrderTime`, `lineCost`, `lineProfit` exist on `orderItems` and `totalCost`, `profit` on `orders`.

---

## 1. Order Detail Page (Primary) — `/apps/admin/app/(dashboard)/orders/[id]/_content.tsx`

**Lines with cost/profit display:**
- **Line 979–989** (Order total card footer): `Tổng cộng` sum + line 990–1004 payment breakdown
- **Line 863–957** (Item table rows): Per-line display of `item.unitPrice` (line 933) and `item.lineTotal` (line 940)

**Fulfillment status scope:**
- ✅ `fulfillmentStatus` in scope at line 416 (`const fulfillmentStatus = ...`)
- ✅ `order.items` loop has access (line 863)

**Recommended badge placement:**
- Add badge next to "Tổng cộng" label (line 980) when `fulfillmentStatus === "pending"` AND `order.totalCost > 0`
- Option: Add per-line badge after `lineTotal` cell (line 937–940) when `item.costPriceAtOrderTime > 0`

**UI Components available:**
- Badge: line 13 (`import { Badge }`)
- Tooltip: Import from `@workspace/ui/components/tooltip` (not yet in this file)

---

## 2. Order List Table — `/apps/admin/components/admin/orders/order-table.tsx`

**Current display:**
- Line 72–73: Shows only `order.total` (revenue)
- No cost/profit columns exist yet

**Fulfillment status scope:**
- ✅ `order.fulfillmentStatus` accessible in `orders.map()` loop (line 44)

**Badge placement consideration:**
- Cost column not currently shown; if added, badge appears at same row level
- More likely: Small indicator badge next to status badge (line 63–70) for visual grouping

**UI Components available:**
- Badge already imported (line 3)

---

## 3. Customer Order History Table — `/apps/admin/components/admin/customer-detail/customer-order-history-table.tsx`

**Current display:**
- Line 84–87: Shows only `order.total`
- No cost breakdown

**Fulfillment status scope:**
- ✅ `order.fulfillmentStatus` in loop (line 59)

**Badge placement consideration:**
- Similar to order-table: Badge next to status badge (line 77–82) when pending + has cost

---

## Schema Fields (Confirmed)

**Order level** (`orders` table):
- `totalCost` (decimal, line 45 of schema)
- `profit` (decimal, line 46 of schema)

**Line item level** (`orderItems` table):
- `costPriceAtOrderTime` (line 95–98)
- `lineCost` (line 100)
- `lineProfit` (line 101)

---

## Badge Implementation Pattern

**Existing models in codebase:**
- `/apps/admin/lib/order-badges.ts` (lines 3–17): `PAYMENT_BADGE` and `FULFILLMENT_BADGE` dicts with `{ label, className }`
- `@workspace/ui/components/badge` (line 6–26 in badge.tsx): supports `variant` prop (default, secondary, destructive, outline, ghost, link)
- `@workspace/ui/components/tooltip` (lines 20–55): `Tooltip`, `TooltipTrigger`, `TooltipContent` pattern

**Suggested badge:**
```
className: "bg-amber-50 text-amber-700 border border-amber-200"
label: "Giá vốn tạm tính"
tooltip: "Giá vốn chưa được cố định. Sẽ được cập nhật khi xuất kho từ giá WAC thực tế."
```

---

## Next Steps (Not Implemented)
1. Add badge state to order-badges.ts for consistency
2. Wrap cost display in `<Tooltip>` with estimated COGS label
3. Conditionally render badge when `fulfillmentStatus === "pending" && (totalCost > 0 || lineCost > 0)`
4. Consider adding cost column to order-table.tsx if business requires it

**No code changes needed for this exploration.**
