---
id: TC-SEC-007
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Chat-System]]
---

# TC-SEC-007: File Upload Validation

## Pre-conditions

- Logged in as Admin.
- Chat image upload enabled.

## Test Steps

1. Upload a non-image file renamed as .jpg.
2. Upload a file exceeding size limit.
3. Upload a valid image.

## Expected Result

- Non-image file is rejected.
- Oversized file is rejected with error.
- Valid image uploads successfully.

## Related Docs

- [[Spec-Chat-System]]
