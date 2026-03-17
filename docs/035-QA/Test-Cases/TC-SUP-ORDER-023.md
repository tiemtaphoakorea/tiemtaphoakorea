---
id: TC-SUP-ORDER-023
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-023: Sanitize Note Field Against XSS

## Pre-conditions

- Logged in as Admin.
- Valid product variant exists.

## Test Steps

1. Create supplier order.
2. Update status with note containing: `<script>alert("XSS")</script>`.
3. Verify via API.

## Expected Result

- Order is updated successfully.
- Note is either sanitized (script tag removed) or stored safely.
- No security vulnerability (script is not executed).
