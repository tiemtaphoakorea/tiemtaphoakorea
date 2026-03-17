---
id: TC-ANALYTIC-001
type: test-case
status: active
feature: Analytics
created: 2026-02-01
updated: 2026-02-01
linked-to: []
---

# TC-ANALYTIC-001: Display Analytics Overview

## Pre-conditions

- Logged in as Admin.
- Analytics module is available.

## Test Steps

1. Navigate to Analytics page (`/analytics`).
2. Wait for analytics data to load (page fetches from `GET /api/admin/analytics`; content such as "Tổng doanh thu" or "Doanh thu" appears when ready).
3. Verify page heading contains "Phân tích", "Báo cáo", or "Analytics".
4. Verify at least one of: "Top", "Sản phẩm", "Doanh thu" (or equivalent) is visible.

## Expected Result

- Analytics page loads.
- Overview content (e.g. top products, revenue) is visible.
