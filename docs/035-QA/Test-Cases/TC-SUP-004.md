---
id: TC-SUP-004
type: test-case
status: draft
feature: Supplier Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Supplier-Management]]
---

# TC-SUP-004: Supplier Search and Include Inactive

## Pre-conditions

- Logged in as Admin or Manager.
- Supplier "Alpha Supplies" active, Supplier "Beta Supplies" inactive.

## Test Steps

1. Search by name keyword "Alpha".
2. Search by supplier code.
3. Search by phone or email.
4. Enable "Include inactive" (if available).

## Expected Result

- Search returns matching suppliers by name/code/phone/email.
- Inactive suppliers are hidden by default.
- Inactive suppliers appear when include inactive is enabled.

## Related Docs

- [[Spec-Supplier-Management]]
