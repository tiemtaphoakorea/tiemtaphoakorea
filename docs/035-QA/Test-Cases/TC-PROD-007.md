---
id: TC-PROD-007
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-007: Update Cost Price History

## Pre-conditions

- Logged in as Admin or Manager.
- Existing variant with cost_price = 180,000 and at least one history record.

## Test Steps

1. Open variant details.
2. Change cost_price to 200,000.
3. Click "Save".
4. Open cost price history view.

## Expected Result

- Variant cost_price updates to 200,000.
- A new history record is created with the previous value and timestamp.
