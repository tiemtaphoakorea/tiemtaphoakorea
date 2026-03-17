---
id: TC-ORD-017
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-017: Order Admin Note Edit Allowed

## Pre-conditions

- Logged in as Staff or Admin.
- Existing order with status pending or paid.

## Test Steps

1. Open order detail.
2. Update Admin Note field.
3. Save changes.
4. Reload order detail.

## Expected Result

- Admin Note is updated successfully.
- Other order fields (items, quantities) remain unchanged.

## Related Docs

- [[Spec-Order-Management]]
