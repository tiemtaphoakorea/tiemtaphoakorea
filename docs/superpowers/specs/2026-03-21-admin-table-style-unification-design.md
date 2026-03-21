# Admin Table Style Unification

**Date:** 2026-03-21
**Status:** Approved

## Problem

Admin tables use 3 distinct visual styles, making the UI feel inconsistent.

## Decision

Unify all tables to **Option B — clean modern shadcn default**:
- Sentence-case headers (`font-medium text-foreground`, 12px)
- No header background
- White rows with `hover:bg-muted/50` on hover
- No uppercase, no zebra striping

## Changes

Remove custom header overrides from each table file. The base `table.tsx` already provides the correct defaults — the custom classes are overriding them unnecessarily.

**Per-file changes:**
- Remove `bg-slate-50/50 dark:bg-slate-900/50` (and variants) from `TableHeader` rows
- Remove `text-[10px] font-black tracking-widest text-slate-400 uppercase` from `TableHead` cells
- Remove redundant `hover:bg-slate-50/50` from `TableRow` where already covered by base

**Files:**
1. `apps/admin/components/admin/orders/order-table.tsx`
2. `apps/admin/components/admin/customers/customer-table.tsx`
3. `apps/admin/components/admin/products/product-table.tsx`
4. `apps/admin/components/admin/suppliers/supplier-table.tsx`
5. `apps/admin/components/admin/supplier-orders/supplier-order-table.tsx`
6. `apps/admin/components/admin/orders/order-item-table.tsx`
7. `apps/admin/components/admin/order-detail/order-items-table.tsx`
8. `apps/admin/components/admin/customer-detail/customer-order-history-table.tsx`
9. `apps/admin/components/admin/orders/create/order-items-table.tsx`
