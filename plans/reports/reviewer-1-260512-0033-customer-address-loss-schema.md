# Reviewer-1: Schema + Service + API — Customer Address Loss

**Date:** 2026-05-12 | **Scope:** DB schema, service layer, API routes, payload construction

---

## Evidence Collected

### 1. Schema — `packages/database/src/schema/profiles.ts:22`
```ts
address: text("address"),  // nullable, no default
```
Single `text` column. No `NOT NULL`, no `DEFAULT ''`. Writing `null` or omitting is fine at DB level. **Schema is not the cause.**

### 2. Service layer — `packages/database/src/services/customer.server.ts:181-191`
```ts
export async function updateCustomer(id, data) {
  const [updatedProfile] = await db
    .update(profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(profiles.id, id))
    .returning();
  return updatedProfile;
}
```
Pure spread: only sets fields present in `data`. If `address` is absent from `data`, DB column is untouched. If `address: ""` (empty string) is present, it **writes `""` to DB**, not `null`. **Service logic is correct for partial updates — but is vulnerable to whatever the caller puts in `data`.**

### 3. API PUT handler — `apps/admin/app/api/admin/customers/[id]/route.ts:40-42`
```ts
const updates = await request.json();
const updatedProfile = await updateCustomer(id, updates);
```
No Zod validation, no field whitelist. Whatever JSON arrives is passed directly to `updateCustomer`. **No filtering of `address: ""` → empty string will be persisted.**

### 4. Bug Path A — `customer-edit-sheet.tsx` via `_content.tsx:55-59` (detail page)

`handleEditCustomer` reads FormData:
```ts
address: (formData.get("address") as string) ?? undefined,
```
`formData.get("address")` returns `""` (empty string) when field is blank — **not `null`**, so `?? undefined` does NOT trigger (empty string is truthy to `??`). Payload sent: `{ address: "" }`. DB stores `""`.

On next load the display shows `""` which renders as "Chưa cập nhật" — functionally lost.

### 5. Bug Path B — `customer-drawer.tsx:91` (list page quick-edit)
```ts
address: values.address?.trim() || undefined,
```
Correct pattern — empty string → `undefined` → field omitted from payload → DB untouched. **This path does NOT cause data loss.**

### 6. `objectToFormData` — `packages/shared/src/schemas/index.ts:8-9`
```ts
if (value === undefined || value === null) continue;
fd.append(key, String(value));
```
`""` (empty string) passes through and is appended. So if user clears the address field in `customer-edit-sheet.tsx`, `address=""` is sent in FormData and ultimately written to DB.

---

## Hypotheses & Confidence

| # | Hypothesis | Confidence | Status |
|---|-----------|-----------|--------|
| H1 | `handleEditCustomer` in detail page passes `address: ""` instead of `undefined` when field is blank | **85%** | Confirmed by code |
| H2 | A separate PATCH/PUT call from order detail resets address | 10% | No evidence — order updates use `shippingAddress`, not `profiles.address` |
| H3 | DB schema default wipes address | 5% | Eliminated — no `DEFAULT` set |

---

## Root Cause (Primary)

**File:** `apps/admin/app/(dashboard)/customers/[id]/_content.tsx:58`

```ts
address: (formData.get("address") as string) ?? undefined,
// ^ formData.get returns "" not null when field is empty
// ?? undefined DOES NOT fire for ""
// Result: address: "" is sent to PUT /api/admin/customers/[id]
```

When a user edits a customer in the detail page and the address field is blank (or they clear it), `""` is persisted to DB. The column is `text` so it stores `""`. UI then displays it as blank/missing because all display logic uses `|| "fallback"` — but the real value is `""` not `null`. However if user had an address before and someone saves another field without touching address, the address field still gets `""` written **if the form initialized with `""` for a null address** (line 52: `address: customer.address ?? ""`).

**This is the primary loss scenario**: customer has `address = null` → detail-page edit form initializes `address: ""` → user saves any other field → `address: ""` sent → DB now has `""` → appears blank but is actually stored as `""`. Next time `customer-edit-sheet` initializes: `customer.address ?? ""` → still `""` → no recovery path.

---

## Cross-check Requests

**For reviewer-2 (UI):**
- Confirm `customer-edit-sheet.tsx` is the form used on the customer detail page (not the drawer)
- Does any UI component distinguish between `""` and `null` for address display? If not, users see the same blank UI in both cases, masking whether data was actually lost or just null

**For reviewer-3 (form state):**
- When `customer-edit-sheet` mounts with `customer.address = null` → `address: ""` — does RHF's `values` prop cause a re-render that submits `""` prematurely?
- Confirm `useForm({ values: ... })` re-syncs on customer prop change — this could cause spurious dirty state

---

## Fix (immediate)

In `apps/admin/app/(dashboard)/customers/[id]/_content.tsx:58`:
```ts
// Before (buggy):
address: (formData.get("address") as string) ?? undefined,

// After:
address: (formData.get("address") as string)?.trim() || undefined,
```

Also add in API PUT handler at `apps/admin/app/api/admin/customers/[id]/route.ts`:
```ts
// Sanitize before passing to service
const { address, ...rest } = updates;
const sanitized = { ...rest, ...(address !== undefined ? { address: address || null } : {}) };
await updateCustomer(id, sanitized);
```

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Root cause isolated to `_content.tsx:58` — `??` operator not guarding against empty string from FormData; `address: ""` overwrites existing address or null. `customer-drawer.tsx` (list page) uses `|| undefined` correctly and is NOT affected.
**Concerns:** The `objectToFormData` utility at `packages/shared/src/schemas/index.ts:8` also passes `""` through — any other form using this utility + FormData for optional fields has the same class of bug.
