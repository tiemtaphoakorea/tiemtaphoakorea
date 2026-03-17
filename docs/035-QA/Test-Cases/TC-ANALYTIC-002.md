---
id: TC-ANALYTIC-002
type: test-case
status: active
feature: Analytics
created: 2026-02-01
updated: 2026-02-01
linked-to: []
---

# TC-ANALYTIC-002: Allow Report Download

## Pre-conditions

- Logged in as Admin.
- On Analytics page (`/analytics`).
- Download/Export button may be present.

## Test Steps

1. Navigate to Analytics page (`/analytics`).
2. Wait for analytics data to load (content such as "Tổng doanh thu" or "Doanh thu" appears).
3. Locate download/export control (e.g. "Tải xuống", "Download", "Export", "Xuất báo cáo").
4. If visible, click it and wait for download event.

## Expected Result

- If download is available: a file is downloaded with extension .pdf, .xlsx, .xls, or .csv.
- Suggested filename is non-empty.
