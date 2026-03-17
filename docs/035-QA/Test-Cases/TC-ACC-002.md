---
id: TC-ACC-002
type: test-case
status: draft
feature: Accounting
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-002: Cost Price History Logged

## Pre-conditions

- Logged in as Admin (Owner).
- Variant cost_price = 100,000.

## Test Steps

1. Update cost_price to 120,000.
2. Open cost price history.

## Expected Result

- History record created with old_price = 100,000 and new_price = 120,000.
- Timestamp and changed_by are recorded.
