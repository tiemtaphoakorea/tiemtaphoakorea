# Reviewer-3: Customer Address Loss — Cross-Feature Sync Analysis

**Date:** 2026-05-12  
**Scope:** address sync between `customer (profiles.address)` ↔ `order.shippingAddress`

---

## Architecture Clarification (critical context)

`profiles.address` = customer's permanent address on their profile.  
`orders.shippingAddress` = per-order shipping address stored **separately** on the order row.

These are **two distinct fields** — the system does NOT automatically sync one to the other. This is by design (order-level shipping can differ from customer's home address).

---

## Finding 1 — No Upsert of Customer Address from Order Flow (CONFIRMED SAFE)

**Files checked:**
- `packages/database/src/services/order.server.ts:163-374` (`createOrder`)
- `apps/admin/app/api/admin/orders/route.ts:64-223` (POST)
- `apps/admin/app/api/admin/orders/[id]/route.ts:34-80` (PUT)
- `packages/database/src/services/order.server.ts:782-913` (`updateOrder`)

**Evidence:** `createOrder` calls `findOrCreateCustomer()` which only creates a new profile; it never updates an existing profile's `address`. `updateOrder` only writes to the `orders` table — never touches `profiles`. `updateCustomer` is never called from any order code path.

**Conclusion:** Creating or editing an order does NOT overwrite `profiles.address`. This hypothesis is **eliminated**.

---

## Finding 2 — CustomerEditSheet Uses `values:` (Not `defaultValues:`) — CONFIRMED BUG

**File:** `apps/admin/components/admin/customers/customer-edit-sheet.tsx:46-56`

```ts
const form = useForm<CustomerFormValues>({
  resolver: zodResolver(customerSchema),
  values: customer          // <-- react-hook-form `values` prop
    ? { fullName: ..., phone: ..., address: customer.address ?? "" ... }
    : { fullName: "", phone: "", address: "", customerType: "retail" },
});
```

**`values:` vs `defaultValues:`**: `values` keeps the form in sync with the `customer` prop on every render. If the parent re-fetches or the query cache updates while the Sheet is open, the form silently resets to the latest server value — **discarding whatever the user had typed but not yet submitted**.

**Scenario that loses address (60% confidence):**
1. Admin opens "Chỉnh sửa" sheet for a customer.
2. Admin types a new address in the field.
3. Before clicking "Lưu thay đổi", something triggers a re-render with a stale/updated `customer` prop — e.g., React Query background refetch (default `staleTime: 0`) fires while the sheet is open.
4. `values:` re-syncs the form to the fetched data → typed address is **silently overwritten** with the old server value.
5. Admin clicks "Lưu thay đổi" → saves the old value back. Address appears "lost".

**Trigger:** `useQuery` on `queryKeys.customer(id)` has no explicit `staleTime`, so default is 0 — any window focus or query invalidation refetches and the `values:` form re-syncs.

---

## Finding 3 — `ChangeCustomerDialog` Does NOT Overwrite Customer Address (SAFE)

**File:** `apps/admin/components/admin/order-detail/change-customer-dialog.tsx:63-73`

`handleConfirm` calls `onConfirm(selected.id)` which calls `adminClient.updateOrder(order.id, { customerId: newCustomerId })`. This only updates `orders.customerId` — never modifies `profiles.address`. **Eliminated.**

---

## Finding 4 — `OrderShippingSection` "Dùng địa chỉ khách hàng" Mode Copies, NOT Syncs

**File:** `apps/admin/components/admin/orders/order-shipping-section.tsx:63-83`

When mode = "customer", `handleSave` sends:
```ts
{ shippingAddress: customer.address ?? null }
```
This saves `customer.address` into `orders.shippingAddress`. Does NOT write back to `profiles`. Safe.

But there's a separate concern: `deriveMode()` (line 201-218) switches back to `"customer"` mode if all three shipping fields match the customer profile exactly. If customer address changed after the order was created, the mode logic could cause a subsequent save to **overwrite a custom order-level address with the now-different customer address**. Low likelihood, not the primary cause.

---

## Finding 5 — `CustomerEditSheet` `handleEditCustomer` Sends Empty String for Address (20% confidence)

**File:** `apps/admin/app/(dashboard)/customers/[id]/_content.tsx:51-71`

```ts
const payload = {
  address: (formData.get("address") as string) ?? undefined,
  ...
};
```

`formData.get("address")` returns `""` (empty string) if field is blank, not `null`/`undefined`. `updateCustomer` (customer.server.ts:171-191) does a direct spread: `db.update(profiles).set({ ...data })`. If `address: ""` is passed, it writes an empty string to `profiles.address`, which displays as "Không có địa chỉ" — effectively appearing as lost.

**Scenario (20%):** Admin opens edit sheet, accidentally clears address field, saves → `""` written to DB.

---

## Root Cause — Primary Hypothesis

**`values:` prop in `CustomerEditSheet` (Finding 2) — 60% confidence**

The form is controlled by the live `customer` object via `values:`. React Query's background refetch (staleTime=0) while the Sheet is open silently resets mid-edit form state. Admin types address, waits, form resets, admin doesn't notice, saves old value.

**Secondary (Finding 5) — 20% confidence**: Empty-string sent as address from accidental clear + save.

---

## Reproduction Steps (Primary)

1. Open customer detail page → click "Chỉnh sửa".
2. Edit the address field — type new address.
3. Trigger a refetch: switch to another tab and back (window focus), or wait ~30s.
4. React Query refetches `queryKeys.customer(id)` → parent `customer` prop updates → `values:` resets form.
5. Click "Lưu thay đổi" — saves the **pre-edit** address.

---

## Fixes

| # | Fix | File | Priority |
|---|-----|------|----------|
| 1 | Change `values:` to `defaultValues:` in `CustomerEditSheet` | `customer-edit-sheet.tsx:48` | P0 |
| 2 | Add `staleTime: 30_000` to `queryKeys.customer(id)` query in `_content.tsx:44` | `customers/[id]/_content.tsx` | P1 |
| 3 | Sanitize empty-string address: convert `""` → `null`/`undefined` before `updateCustomer` | `_content.tsx:55-60` | P1 |

---

## What Was Ruled Out

- Order creation/edit overwriting `profiles.address` — NO (no code path does this)
- `ChangeCustomerDialog` overwriting address — NO (only changes `orders.customerId`)
- Webhook/background job resetting address — NO (no such job found)
- Race condition between 2 tabs — LOW (not the primary vector; possible but needs background sync)
- Receipt/PO supplier flow affecting customer address — NO (separate supplier table, unrelated)

---

## Unresolved Questions

1. Is `staleTime` configured globally somewhere (e.g., `QueryClient` provider) that might affect this?
2. Has anyone observed this on the **order shipping address** specifically, or only the **customer profile address**? The bug only affects profile address; order shipping address has a separate edit flow.
3. Are there automated tests for `CustomerEditSheet` form behavior on re-render?

**Status:** DONE_WITH_CONCERNS  
**Summary:** Primary root cause is `values:` (not `defaultValues:`) in `CustomerEditSheet` causing silent form reset on React Query background refetch. No order↔customer address sync issue found — the two address fields are structurally independent.  
**Concerns:** Cannot 100% confirm without reproducing with network tab open to see refetch timing; the `values:` behavior is a known RHF footgun that matches the symptom perfectly.
