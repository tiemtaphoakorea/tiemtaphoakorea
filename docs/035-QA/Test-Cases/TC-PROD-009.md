---
id: TC-PROD-009
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-009: Variant Image Upload Rules

## Pre-conditions

- Logged in as Admin or Manager.
- On product variant image uploader.

## Test Data

| Case | File Type | Size | Count | Expected |
| ---- | --------- | ---- | ----- | -------- |
| A    | image/jpeg | 2MB | 1 | Upload succeeds |
| B    | image/png | 6MB | 1 | Error: exceeds 5MB |
| C    | image/gif | 1MB | 1 | Error: unsupported type |
| D    | image/webp | 1MB | 11 | Error: max 10 images |

## Test Steps

1. For each case, attempt to upload the file(s).
2. If multiple images uploaded, verify primary image order.

## Expected Result

- Only allowed types (jpeg, png, webp) under 5MB are accepted.
- Max 10 images per variant enforced.
- The first uploaded image is marked as primary.
