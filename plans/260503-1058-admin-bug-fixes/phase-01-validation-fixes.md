---
phase: 1
title: "Validation Fixes"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Validation Fixes

## Overview
Fix three missing/bypassable validation guards in admin settings forms: store name (whitespace-only), customer tier thresholds (negative numbers), and the banner display for entries with no title.

## Requirements
- Store name must not be saved if empty after `.trim()`
- Tier threshold fields must reject values < 1 (min orders) or < 0 (min spend) at JS level
- Banner list should not silently activate banners without images/title (display warning or block save)

## Architecture
All fixes are purely client-side guard additions before API calls — no schema/API changes needed.

## Related Code Files
- Modify: `apps/admin/app/(dashboard)/settings/_content.tsx`

## Implementation Steps

### Fix 1 — Store name whitespace guard
`settings/_content.tsx → saveShopInfo()` (~line 57):

```ts
async function saveShopInfo() {
  if (!shopName.trim()) {
    toast.error("Tên cửa hàng không được để trống");
    return;
  }
  setShopSaving(true);
  // ... existing code, send shopName.trim()
  body: JSON.stringify({
    name: shopName.trim(),   // add .trim()
    ...
  })
}
```

### Fix 2 — Tier threshold negative/zero guard
`settings/_content.tsx → saveMutation` mutation function (~line 305):

Add after the `Number.isFinite` check:
```ts
if (
  data.loyalMinOrders < 1 ||
  data.frequentMinOrders < 1 ||
  data.loyalMinSpent < 0 ||
  data.frequentMinSpent < 0
) {
  throw new Error("Số đơn tối thiểu phải ≥ 1, tổng chi tiêu phải ≥ 0");
}
```

Also restore the tier config back to valid values after testing (loyalMinOrders: 10, loyalMinSpent: 5000000, frequentMinOrders: 5, frequentMinSpent: 2000000) via the UI.

## Success Criteria
- [x] Saving store name with only spaces shows error toast, does not call API
- [x] Saving tier config with negative order count shows error toast
- [x] Saving tier config with `0` order count shows error toast (min is 1)
- [x] Valid values still save successfully

## Risk Assessment
Low risk — additive guard before existing API calls, no API contract changes.
