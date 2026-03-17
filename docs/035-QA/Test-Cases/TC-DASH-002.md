---
id: TC-DASH-002
type: test-case
status: draft
feature: Dashboard
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-002: Dashboard KPI Calculations

## Pre-conditions

- Logged in as Admin.
- Known delivered orders today totaling 600,000.
- Known delivered orders yesterday totaling 400,000.

## Test Steps

1. Open Dashboard.
2. Check Revenue (today) and % change vs yesterday.

## Expected Result

- Revenue today = 600,000.
- Change percent is calculated correctly based on yesterday's revenue.
