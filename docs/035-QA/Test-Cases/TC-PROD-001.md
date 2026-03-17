---
id: TC-PROD-001
type: test-case
status: review
feature: Product Management
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-001: Product Creation & Variant Management

## Pre-conditions

- Logged in as Admin or Manager.
- On Products page (admin subdomain).

## Test Steps

1. Click "New Product".
2. Enter Title: "Test T-Shirt".
3. Add Variant: Color="Red", Size="L" (SKU "TS-RED-L").
4. Set Cost Price: 100,000, Retail Price: 200,000.
5. Upload one image for the variant.
6. Click "Save".

## Expected Result

- Product "Test T-Shirt" appears in the list.
- Variant "Red / L" is created with correct SKU, prices, and stock (0 by default for in_stock if not provided).
- Uploaded image is saved and shown as primary.
