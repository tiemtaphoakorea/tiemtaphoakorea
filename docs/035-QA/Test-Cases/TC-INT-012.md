---
id: TC-INT-012
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-012: Concurrent Payment Submissions

## Pre-conditions

- Logged in as Staff or Admin.
- Order total = 1,000,000.
- Two separate sessions (A and B).

## Test Steps

1. Session A records payment of 600,000.
2. Session B records payment of 600,000 at the same time.

## Expected Result

- System prevents paid_amount from exceeding total.
- One payment is accepted and the other is rejected or adjusted.
- Final paid_amount does not exceed 1,000,000.

## Related Docs

- [[Spec-Order-Management]]
