# Reviewer-2: Customer Address Loss — UI/Form State Analysis

Date: 2026-05-12 | Scope: UI form components + form state management

---

## Key Finding: TWO Separate Edit Paths, Only One Is Safe

The admin app has **two different components** that can update a customer:

| Path | Component | Update mechanism |
|------|-----------|-----------------|
| `/customers` list page | `customer-drawer.tsx` | `useMutation` → `PUT /api/admin/customers/:id` with full payload |
| `/customers/[id]` detail page | `customer-edit-sheet.tsx` | FormData → `handleEditCustomer` → `PUT /api/admin/customers/:id` |

Both hit the same endpoint. The DB layer (`updateCustomer`, line 181–188) does a spread `...data` — so any field that is **explicitly present with empty string** will overwrite the stored value.

---

## Root Cause Hypotheses

### H1 — `customer-edit-sheet.tsx`: `values` re-init with stale/missing address (65% confidence)

**File:** `customer-edit-sheet.tsx` lines 48–55

```ts
values: customer
  ? {
      fullName: customer.fullName ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",   // ← picks from `customer` prop
      customerType: ...
    }
  : { fullName: "", phone: "", address: "", ... },
```

RHF's `values` prop re-syncs the form whenever the prop changes. The `customer` prop passed from `_content.tsx` line 202 is `data?.customer` from the React Query cache. If the cache entry does not include `address` (e.g., the list-page cache `queryKeys.customers.all` shape `CustomerStatsItem` has `address` but the detail query `queryKeys.customer(id)` returns `CustomerDetail` which does), this path is safe **IF** the correct query key is used.

**Cross-check needed with reviewer-3:** confirm `queryKeys.customer(id)` always returns `CustomerDetail` with `address`, not `CustomerStatsItem`.

### H2 — `customer-drawer.tsx`: Empty address sent as `undefined`, clearing stored value (55% confidence)

**File:** `customer-drawer.tsx` lines 89–92

```ts
const payload = {
  phone: values.phone?.trim() || undefined,   // empty → undefined → skipped by PUT
  address: values.address?.trim() || undefined, // ← same
};
```

`objectToFormData` skips `undefined` (line 9: `if (value === undefined || value === null) continue`). But `customer-drawer` uses `useMutation` directly with a plain object — NOT FormData. So `undefined` fields ARE included in the JSON body as omitted keys (JSON.stringify drops them). The DB `updateCustomer` spreads `...data`, so undefined fields are simply absent from the SET clause — this is safe.

**However:** the drawer invalidates `queryKeys.customers.all` (line 64) — the list-level cache. The detail page uses `queryKeys.customer(id)`. After drawer edit, the detail page cache is **not invalidated**. If the user then opens `customer-edit-sheet`, the form initializes from the stale detail cache that still shows the OLD address. If they save without noticing, the address field value is whatever was in the stale cache, not what the drawer just saved.

This is a **stale cache cross-contamination** scenario, not a direct data-loss write.

### H3 — `handleEditCustomer` in `_content.tsx`: empty string address sent to backend (70% confidence)

**File:** `_content.tsx` lines 55–60

```ts
const payload = {
  fullName: (formData.get("fullName") as string) ?? undefined,
  phone:    (formData.get("phone")    as string) ?? undefined,
  address:  (formData.get("address")  as string) ?? undefined,  // ← KEY ISSUE
  customerType: ...
};
```

`formData.get("address")` returns `""` (empty string) when user clears the field OR when form initializes with `""` (e.g., customer has no address set, `customer.address ?? ""`). The `?? undefined` fallback only fires on `null`/`undefined` — NOT on empty string `""`. So **`address: ""`** is sent in payload.

The DB handler at `customer.server.ts` line 183–185 does:
```ts
.set({ ...data, updatedAt: new Date() })
```

`address: ""` explicitly sets the column to empty string. If the backend column allows empty string (not enforced as NULL), the value becomes `""`. On next load, `customer.address` is `""`, form inits to `""`, display shows "Chưa cập nhật" — looks like data was lost.

**This is the most likely production bug.** The `objectToFormData` (line 9) correctly skips `undefined`/`null` but passes `""` through. The payload builder uses `?? undefined` which does NOT convert `""` to `undefined`.

---

## Timeline of Bug Trigger

1. Customer has `address = "123 Main St"` in DB
2. Admin opens Edit sheet — form shows address correctly (from detail cache)
3. Admin clears address field (or never had one and it's `""`)
4. Submit → `formData.get("address")` = `""` → payload `{ address: "" }` → PUT → DB sets `address = ""`
5. Next page load: address shows as empty → customer reports "địa chỉ bị mất"

---

## Cross-Checks Needed

- **Reviewer-1 (schema):** Does the DB column `profiles.address` have a NOT NULL constraint or default? If nullable, confirm `""` vs `NULL` behavior in queries and frontend display.
- **Reviewer-3 (state mgmt):** Confirm `queryKeys.customer(id)` vs `queryKeys.customers.all` invalidation gap — drawer edit doesn't invalidate detail cache. Also: does `useQuery` for detail page ever serve from `customers.all` cache via `initialData`?

---

## Fix Recommendation

In `_content.tsx` `handleEditCustomer`, change the payload builder to convert empty strings to `undefined`:

```ts
address: (formData.get("address") as string) || undefined,  // || not ??
```

Same fix should apply to `phone` and `fullName` (though fullName has min(1) validation so less likely).

Additionally, in `customer-drawer.tsx` line 64: also invalidate `queryKeys.customer(id)` (or use a broader key) when updating so detail-page cache is fresh.

---

## Unresolved Questions

1. Does backend `updateCustomer` treat `address: ""` and `address: undefined` differently? (Need reviewer-1 to confirm DB column constraints.)
2. Is there a case where `customer` prop passed to `CustomerEditSheet` is `CustomerStatsItem` instead of `CustomerDetail`? Both have `address` field so probably safe, but worth confirming.
3. Does `CustomerDrawer` appear in any page that also shows address in a way that could trigger a visible reset?

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Primary bug is `_content.tsx:57` — `?? undefined` fails to exclude empty-string address from PUT payload, causing `address: ""` to overwrite stored value. Secondary issue is stale cache cross-contamination between list-drawer and detail-page edits.
**Concerns:** Fix is straightforward but requires reviewer-1 confirmation of DB column behavior for `""` vs `NULL`.
