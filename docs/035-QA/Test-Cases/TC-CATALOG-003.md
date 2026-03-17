---
id: TC-CATALOG-003
type: test-case
status: draft
feature: Customer Catalog
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Customer-Catalog]]
---

# TC-CATALOG-003: Stock Status Labels

## Pre-conditions

- Variant A: stock_type = in_stock, stock_quantity = 5.
- Variant B: stock_type = in_stock, stock_quantity = 0.
- Variant C: stock_type = pre_order, stock_quantity = 0.
- Public storefront is accessible (no login).

## Test Steps

1. Open catalog and locate products for Variant A, B, C.
2. Open product detail pages for each variant.

## Expected Result

- Variant A shows status "Sẵn sàng giao".
- Variant B shows status "Tạm hết hàng".
- Variant C shows status "Đặt hàng (7-10 ngày)".

## Related Docs

- [[Spec-Customer-Catalog]]
