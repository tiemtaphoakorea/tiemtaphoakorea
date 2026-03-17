---
id: TC-PROD-015
type: test-case
status: draft
feature: Product Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-015: Product Slug Uniqueness Handling

## Pre-conditions

- Logged in as Admin or Manager.
- Product "Basic Tee" exists.

## Test Steps

1. Create a new product with the same title "Basic Tee".
2. Save the product.

## Expected Result

- System generates a unique slug for the new product.
- Both products can be accessed via distinct slugs.

## Related Docs

- [[Spec-Product-Management]]
