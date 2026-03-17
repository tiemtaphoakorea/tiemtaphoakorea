---
id: TC-SUP-003
type: test-case
status: draft
feature: Supplier Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Supplier-Management]]
---

# TC-SUP-003: Deactivate Supplier

## Pre-conditions

- Logged in as Admin or Manager.
- Supplier "NCC Test 01" exists and is active.

## Test Steps

1. Deactivate the supplier.
2. Return to Suppliers list.
3. Search for the supplier with default filters.
4. Enable "Include inactive" (if available).

## Expected Result

- Supplier is not shown in default active list.
- Supplier appears when inactive filter is enabled.
- Supplier status shows inactive.

## Related Docs

- [[Spec-Supplier-Management]]
