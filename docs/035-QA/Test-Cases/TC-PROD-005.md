---
id: TC-PROD-005
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-005: Variant Matrix Generation

## Pre-conditions

- Logged in as Admin or Manager.
- On "New Product" form with variant matrix enabled.

## Test Steps

1. Add Options: Color = [Red, Blue], Size = [S, M].
2. Click "Generate Variants".
3. Review auto-generated SKUs.

## Expected Result

- System generates 4 variants: Red-S, Red-M, Blue-S, Blue-M.
- Each variant has a unique SKU (e.g., auto format like "PROD-RED-S").
- User can edit generated fields before saving.
