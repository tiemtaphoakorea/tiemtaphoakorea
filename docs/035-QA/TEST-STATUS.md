# Test Case Status Manifest

Single-file reference for all test cases. Agents: read this file to find TCs by status, domain, or spec file without opening individual TC files.

**Grep tips:**
- All broken/false-positive tests: `needs-fix`
- Tests with no spec file yet: `missing`
- Tests that always pass incorrectly: `false-positive`
- Tests whose spec file fails at load: `dead-code`

---

## Auth

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-AUTH-001 | Admin Login & Role Check | needs-fix | ⚠️ Has Issues | `tests/e2e/auth/login.spec.ts` |
| TC-AUTH-002 | Admin Login - Validation Errors | reviewed | ✅ Adequate | `tests/e2e/auth/login.spec.ts` |
| TC-AUTH-003 | Admin Login - Invalid Credentials | needs-fix | ⚠️ Duplicate ID (lines 57+71) | `tests/e2e/auth/login.spec.ts` |
| TC-AUTH-004 | Admin Login - Non-internal User Blocked | reviewed | ✅ Adequate | `tests/e2e/auth/login.spec.ts` |
| TC-AUTH-005 | Admin Logout | needs-fix | ⚠️ Cookie not verified cleared | `tests/e2e/auth/login.spec.ts` |
| TC-AUTH-006 | Admin Route Protection & Session Refresh | reviewed | ✅ Adequate | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-007 | Admin Login Rate Limiting & Lockout | needs-fix | 🔴 False Positive (accepts 400/401) | `tests/e2e/auth/security.spec.ts` |
| TC-AUTH-008 | Staff Login & Role Restrictions | needs-fix | ⚠️ h1/h2 load guard missing | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-009 | Manager Login & Role Restrictions | needs-fix | ⚠️ Missing positive API assertion | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-010 | Role-Based Access Restrictions by Module | reviewed | ✅ Adequate | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-011 | Owner-Only API Access | reviewed | ✅ Adequate | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-012 | Staff Access Limited to Orders/Products/Customers | reviewed | ✅ Adequate | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-013 | Manager Access to Reports vs Users | reviewed | ✅ Adequate | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-014 | Inactive User Session Revocation | reviewed | ✅ Adequate | `tests/e2e/auth/access-control.spec.ts` |
| TC-AUTH-015 | Direct URL Access Guard | reviewed | ✅ Adequate | `tests/e2e/auth/access-control.spec.ts` |

## Security

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-SEC-001 | Unauthorized API Access Blocked | needs-fix | ⚠️ GET-only; data leak paths incomplete | `tests/e2e/security/unauthorized-access.spec.ts` |
| TC-SEC-002 | Role Escalation Attempt Blocked | needs-fix | 🔴 False Positive (fake user ID gets 404 not 403) | `tests/e2e/security/role-escalation.spec.ts` |
| TC-SEC-003 | SQL Injection Attempt Blocked | needs-fix | ⚠️ Arbitrary threshold; no path param injection | `tests/e2e/security/sql-injection.spec.ts` |
| TC-SEC-004 | XSS Injection Blocked in Chat Messages | needs-fix | 🔴 False Positive (duplicate ID; early return skips all assertions) | `tests/e2e/security/xss-prevention.spec.ts` |
| TC-SEC-005 | Sensitive Data Not Exposed in Responses | needs-fix | ⚠️ Missing alt field names (apiKey, refreshToken) | `tests/e2e/security/data-exposure.spec.ts` |
| TC-SEC-006 | Session Cookie Security Flags | needs-fix | ⚠️ SameSite=None accepted without Secure check | `tests/e2e/security/cookie-security.spec.ts` |
| TC-SEC-007 | File Upload Validation | needs-fix | 🚫 Dead Code (wrong endpoint → 404) | `tests/e2e/security/file-upload.spec.ts` |
| TC-SEC-008 | CSRF Protection on State-Changing Requests | needs-fix | 🔴 False Positive (always passes) | `tests/e2e/security/csrf-protection.spec.ts` |
| TC-SEC-009 | Rate Limiting on Login Attempts | needs-fix | 🔴 False Positive (hasLockout always true) | `tests/e2e/security/rate-limiting.spec.ts` |
| TC-SEC-010 | RLS Policy Enforcement | needs-fix | ⚠️ Tests HTTP RBAC not DB row-level security | `tests/e2e/security/rls-policy.spec.ts` |
| TC-SEC-011 | Session Fixation Prevention | missing | 🔴 Not Tested | *(spec to be created)* |
| TC-SEC-012 | Session/Token Expiry Enforcement | missing | 🔴 Not Tested | *(spec to be created)* |
| TC-SEC-013 | HTTP Method Override Attack | missing | 🔴 Not Tested | *(spec to be created)* |

## Products

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-PROD-001 | Product Creation & Variant Management | reviewed | ✅ Adequate | `tests/e2e/products/list.spec.ts` |
| TC-PROD-002 | Product List - Search, Filters, Pagination | needs-fix | ⚠️ Hardcoded SKU may conflict on re-runs | `tests/e2e/products/list.spec.ts` |
| TC-PROD-003 | Create Product - Validation Errors | draft | — | — |
| TC-PROD-004 | Create Product - Duplicate SKU | draft | — | — |
| TC-PROD-005 | Variant Matrix Generation | draft | — | — |
| TC-PROD-006 | Update Product Info & Slug | draft | — | — |
| TC-PROD-007 | Update Cost Price History | needs-fix | ⚠️ Old price only; new price/changedBy not asserted | `tests/e2e/products/history.spec.ts` |
| TC-PROD-008 | Add & Remove Variant | draft | — | — |
| TC-PROD-009 | Variant Image Upload Rules | draft | — | — |
| TC-PROD-010 | Inventory Stock Type Behavior | draft | — | — |
| TC-PROD-011 | Low Stock Alert & Stock Filters | draft | — | — |
| TC-PROD-012 | Deactivate Product & Catalog Visibility | needs-fix | 🚫 Dead Code (broken import) | `tests/e2e/products/manage.spec.ts` |
| TC-PROD-013 | Customer Catalog View | needs-fix | ⚠️ Hardcoded localhost:3000 URL | `tests/e2e/products/list.spec.ts` |
| TC-PROD-014 | Category Management | needs-fix | ⚠️ Superseded by TC-CAT-001–005 | `tests/e2e/categories/*.spec.ts` |
| TC-PROD-015 | Product Slug Uniqueness | draft | — | — |
| TC-PROD-016 | Variant Stock Quantity Validation | draft | — | — |
| TC-PROD-017 | Category Filter Uses Active Products Only | draft | — | — |
| TC-PROD-018 | Low Stock Threshold Update Affects Filter | needs-fix | ⚠️ Broad text match can false-match product names | `tests/e2e/products/inventory.spec.ts` |
| TC-PROD-019 | Search Product by SKU in Admin | draft | — | — |
| TC-PROD-020 | Concurrent Stock Update vs Order Creation | needs-fix | ⚠️ OR-assertion; null guard missing | `tests/e2e/products/concurrency.spec.ts` |
| TC-PROD-021 | Concurrent Stock Updates from Two Admin Sessions | needs-fix | ⚠️ OR-assertion; hardcoded range | `tests/e2e/products/concurrency.spec.ts` |
| TC-PROD-022 | Prevent Negative Stock on Manual Update | draft | — | — |

## Categories

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-CAT-001 | Category Create | needs-fix | ⚠️ Previously mislabeled TC-PROD-014 | `tests/e2e/categories/create.spec.ts` |
| TC-CAT-002 | Category Delete | needs-fix | ⚠️ Previously mislabeled TC-PROD-014 | `tests/e2e/categories/delete.spec.ts` |
| TC-CAT-003 | Category Edit | needs-fix | ⚠️ Previously mislabeled TC-PROD-014 | `tests/e2e/categories/edit.spec.ts` |
| TC-CAT-004 | Category List | needs-fix | ⚠️ Previously mislabeled TC-PROD-014 | `tests/e2e/categories/list.spec.ts` |
| TC-CAT-005 | Category Search | needs-fix | ⚠️ URL-only assertion; no result content | `tests/e2e/categories/search.spec.ts` |

## Customer Catalog (Storefront)

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-CATALOG-001 | Catalog List + Search & Filter | needs-fix | 🔴 False Positive (4× duplicate ID; all blocks conditional) | `tests/e2e/guest/storefront.spec.ts` |
| TC-CATALOG-002 | Product Detail Variant Selection | needs-fix | 🔴 False Positive (price never compared; duplicate file) | `tests/e2e/guest/variant-price.spec.ts` |
| TC-CATALOG-003 | Stock Status Labels | needs-fix | ⚠️ Out-of-stock check conditional; duplicate file | `tests/e2e/guest/stock-labels.spec.ts` |
| TC-CATALOG-004 | Public Access to Catalog | needs-fix | ⚠️ Duplicate file (home.spec.ts) | `tests/e2e/guest/storefront.spec.ts` |
| TC-CATALOG-005 | Retail Price Updates After Admin Change | needs-fix | ⚠️ Teardown not in afterEach; hardcoded password | `tests/e2e/guest/price-sync.spec.ts` |
| TC-CATALOG-006 | Catalog Pagination and Empty State | needs-fix | 🔴 False Positive (all blocks conditional) | `tests/e2e/guest/pagination.spec.ts` |
| TC-CATALOG-007 | Product Sort Order on Listing Page | missing | 🔴 Not Tested | *(spec to be created)* |

## Store

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-STORE-001 | Storefront Homepage Load | needs-fix | ⚠️ Generic testid; loose title regex | `tests/e2e/store/homepage.spec.ts` |
| TC-STORE-002 | Product Detail Page | needs-fix | 🔴 False Positive (falls back to random product) | `tests/e2e/store/product-detail.spec.ts` |
| TC-STORE-003 | Navbar Category Links | needs-fix | ⚠️ No waitForLoadState; hardcoded Vi strings | `tests/e2e/store/navbar-links.spec.ts` |
| TC-STORE-004 | Listing Search and Filter | needs-fix | ⚠️ URL assertion fires before debounce | `tests/e2e/store/listing-filter.spec.ts` |
| TC-STORE-005 | Inactive Product Hidden from Storefront | missing | 🔴 Not Tested | *(spec to be created)* |

## Orders

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-ORD-001 | Create & Process Order | reviewed | ✅ Adequate | `tests/e2e/orders/create.spec.ts` |
| TC-ORD-002 | Create Order - Validation Errors | reviewed | ✅ Adequate | `tests/e2e/orders/validation.spec.ts` |
| TC-ORD-003 | Create Order with Mixed Stock Types | needs-fix | ⚠️ Only item count asserted; stockType not verified | `tests/e2e/orders/mixed-stock.spec.ts` |
| TC-ORD-004 | Order Status Transition Rules | draft | — | — |
| TC-ORD-005 | Cancel Order Restores Stock | needs-fix | ⚠️ `>=` comparison; partial cancel not tested | `tests/e2e/orders/stock.spec.ts` |
| TC-ORD-006 | Payment Status Derivation | needs-fix | ⚠️ Clicks first table row (not anchored to order) | `tests/e2e/orders/payment.spec.ts` |
| TC-ORD-007 | Order List - Search & Filters | needs-fix | 🔴 False Positive (pagination conditional; URL-only filter) | `tests/e2e/orders/filters.spec.ts` |
| TC-ORD-008 | Supplier Order Lifecycle | draft | — | — |
| TC-ORD-009 | Order Edit Restrictions | needs-fix | ⚠️ Redundant with TC-ORD-018; `#adminNote` ID brittle | `tests/e2e/orders/edit-restrictions.spec.ts` |
| TC-ORD-010 | Create Order - Insufficient Stock | draft | — | — |
| TC-ORD-011 | Order Number Format and Uniqueness | reviewed | ✅ Adequate | `tests/e2e/orders/create.spec.ts` |
| TC-ORD-012 | Delete Order Rules | needs-fix | 🔴 False Positive (toBe(500) for business rule) | `tests/e2e/orders/delete-rules.spec.ts` |
| TC-ORD-013 | Supplier Orders Gate Preparing/Shipping | draft | — | — |
| TC-ORD-014 | Supplier Order Received Updates Stock | needs-fix | ⚠️ Duplicate of TC-ORD-021 | `tests/e2e/orders/supplier-orders.spec.ts` |
| TC-ORD-015 | Delete Supplier Order Restrictions | needs-fix | 🔴 False Positive (toBe(500) for business rule) | `tests/e2e/orders/supplier-orders.spec.ts` |
| TC-ORD-016 | Supplier Order Update Fields Persist | draft | — | — |
| TC-ORD-017 | Order Admin Note Edit Allowed | draft | — | — |
| TC-ORD-018 | Order Item Quantity Edit Blocked | draft | — | — |
| TC-ORD-019 | Order Status History Logged | needs-fix | ⚠️ Only 2 statuses; changedBy not verified | `tests/e2e/orders/history.spec.ts` |
| TC-ORD-020 | Cancel Order with Pre-order Items | needs-fix | 🔴 False Positive (entire assertion inside if-block) | `tests/e2e/orders/supplier-orders.spec.ts` |
| TC-ORD-021 | Manual Supplier Order Received Increases Stock | needs-fix | ⚠️ Duplicate of TC-ORD-014 | `tests/e2e/orders/supplier-orders.spec.ts` |
| TC-ORD-022 | Cancel Paid Order Restores Stock | needs-fix | ⚠️ Payment amounts/methods not verified | `tests/e2e/orders/payment.spec.ts` |
| TC-ORD-023 | Reject Cancel After Shipping | needs-fix | 🔴 False Positive (toBe(500) for business rule) | `tests/e2e/orders/status.spec.ts` |
| TC-ORD-024 | Order Payment Status Derived from Paid Amount | needs-fix | ⚠️ Near-identical to TC-ORD-006 | `tests/e2e/orders/payment.spec.ts` |
| TC-ORD-025 | Order Total Recalculation with Multiple Items | needs-fix | ⚠️ Uses live variant price not stored unitPrice | `tests/e2e/orders/totals.spec.ts` |
| TC-ORD-026 | Order with Zero Items Rejected | draft | — | — |
| TC-ORD-027 | Variant Format Display in Order | needs-fix | 🚫 Dead Assertion (regex via template literal = string literal) | `tests/e2e/orders/variant-format.spec.ts` |
| TC-ORD-028 | Full Order Lifecycle End-to-End | missing | 🔴 Not Tested | *(spec to be created)* |

## Payments

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-PAY-001 | Partial Payment Recording | needs-fix | ⚠️ Floating-point splits; remainingBalance not checked | `tests/e2e/payments/partial-payments.spec.ts` |
| TC-PAY-002 | Payment Method Validation | needs-fix | ⚠️ Operates on partially-paid order | `tests/e2e/payments/validation.spec.ts` |
| TC-PAY-003 | Payment Amount Validation | needs-fix | ⚠️ Overlaps with TC-PAY-008 | `tests/e2e/payments/validation.spec.ts` |
| TC-PAY-004 | Payment Audit Trail | needs-fix | ⚠️ Amount not verified; only bank_transfer tested | `tests/e2e/payments/audit-trail.spec.ts` |
| TC-PAY-005 | Overpayment Not Allowed | needs-fix | ⚠️ Only one overpayment amount; order status not asserted | `tests/e2e/payments/overpayment.spec.ts` |
| TC-PAY-006 | Multiple Payments Update Remaining Balance | needs-fix | ⚠️ Float rounding; remainingBalance field not verified | `tests/e2e/payments/partial-payments.spec.ts` |
| TC-PAY-007 | Payment Method Required | draft | — | — |
| TC-PAY-008 | Payment Negative Amount Rejected | needs-fix | ⚠️ Overlaps with TC-PAY-003 | `tests/e2e/payments/validation.spec.ts` |
| TC-PAY-009 | Zero Payment Amount Rejected | draft | — | — |
| TC-PAY-010 | Duplicate Payment Submission Prevented | needs-fix | ⚠️ recordPayment helper never passes clientToken | `tests/e2e/payments/duplicate.spec.ts` |
| TC-PAY-011 | Payment on Cancelled Order Rejected | missing | 🔴 Not Tested | *(spec to be created)* |
| TC-PAY-012 | Card Payment Method Coverage | missing | 🔴 Not Tested | *(spec to be created)* |

## Customers

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-CUST-001 | Customer Profile CRUD | needs-fix | 🔴 False Positive (entire create body conditional) | `tests/e2e/customers/create.spec.ts` |
| TC-CUST-002 | Create Customer - Validation Errors | reviewed | ✅ Adequate | `tests/e2e/customers/validation.spec.ts` |
| TC-CUST-003 | Customer Code Auto-Increment | draft | — | — |
| TC-CUST-004 | Customer List - Search & Filters | needs-fix | 🔴 False Positive (URL-only assertion) | `tests/e2e/customers/search.spec.ts` |
| TC-CUST-005 | Customer Classification Change | needs-fix | ⚠️ No cleanup; pagination may hide new record | `tests/e2e/customers/classification.spec.ts` |
| TC-CUST-006 | Customer Deactivate & Reactivate | needs-fix | 🔴 False Positive (conditional + restore not in afterEach) | `tests/e2e/customers/deactivate.spec.ts` |
| TC-CUST-007 | Customer Order History | needs-fix | ⚠️ Only heading visible; no row data asserted | `tests/e2e/customers/order-history.spec.ts` |
| TC-CUST-008 | Auto-Create Customer from Order | needs-fix | ⚠️ Test never creates an order; just checks seed | `tests/e2e/customers/customer-crud.spec.ts` |
| TC-CUST-009 | Customer Stats Calculation | needs-fix | ⚠️ Brittle DOM traversal; 0₫ matches other elements | `tests/e2e/customers/stats.spec.ts` |
| TC-CUST-010 | Duplicate Customer Phone Handling | needs-fix | 🔴 False Positive (tautology: `hasError \|\| true`) | `tests/e2e/customers/customer-crud.spec.ts` |
| TC-CUST-011 | Customer Profile Edit | missing | 🔴 Not Tested | *(spec to be created)* |
| TC-CUST-012 | Customer Reactivation Cycle | missing | 🔴 Not Tested | *(spec to be created)* |

## Suppliers

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-SUP-001 | Create Supplier | reviewed | ✅ Adequate | `tests/e2e/suppliers/create.spec.ts` |
| TC-SUP-002 | Update Supplier Details | reviewed | ✅ Adequate | `tests/e2e/suppliers/update.spec.ts` |
| TC-SUP-003 | Deactivate Supplier | needs-fix | ⚠️ Duplicate in supplier-management.spec.ts with if-guard | `tests/e2e/suppliers/deactivate.spec.ts` |
| TC-SUP-004 | Supplier Search and Include Inactive | needs-fix | ⚠️ URL-only assertion | `tests/e2e/suppliers/search.spec.ts` |
| TC-SUP-005 | Supplier Stats and Recent Orders | reviewed | ✅ Adequate | `tests/e2e/suppliers/stats.spec.ts` |

## Supplier Orders

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-SUP-ORDER-001 | Create Supplier Order | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/create-order.spec.ts` |
| TC-SUP-ORDER-002 | Receive Stock from Supplier Order | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/stock-updates.spec.ts` |
| TC-SUP-ORDER-003 | Transition Status to Ordered | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/status-update.spec.ts` |
| TC-SUP-ORDER-004 | Transition Status to Cancelled | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/status-update.spec.ts` |
| TC-SUP-ORDER-005 | Block Status Change from Final States | needs-fix | 🔴 False Positive (toBe(500) for business rule) | `tests/e2e/supplier-orders/status-final-state.spec.ts` |
| TC-SUP-ORDER-006 | Restrict Delete to Pending/Cancelled | needs-fix | 🔴 False Positive (toBe(500) for business rule) | `tests/e2e/supplier-orders/delete-rules.spec.ts` |
| TC-SUP-ORDER-007 | Filter Orders by Status | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/filter.spec.ts` |
| TC-SUP-ORDER-008 | Update Stock When Receiving In-Stock Items | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/stock-updates.spec.ts` |
| TC-SUP-ORDER-009 | Persist Update Fields | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/status-update.spec.ts` |
| TC-SUP-ORDER-010 | Search Orders by SKU and Product Name | needs-fix | ⚠️ URL-only assertion | `tests/e2e/supplier-orders/search.spec.ts` |
| TC-SUP-ORDER-011 | Supplier Selection When Creating Order | needs-fix | ⚠️ if-guard wraps all assertions | `tests/e2e/supplier-orders/supplier-selection.spec.ts` |
| TC-SUP-ORDER-012 | Set Expected Date When Creating Order | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/expected-date.spec.ts` |
| TC-SUP-ORDER-013 | Empty State When No Orders Exist | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/empty-state.spec.ts` |
| TC-SUP-ORDER-014 | Pagination Functionality | needs-fix | 🔴 False Positive (conditional; never asserts) | `tests/e2e/supplier-orders/pagination.spec.ts` |
| TC-SUP-ORDER-015 | Pre-Order Stock Type Behavior | reviewed | ✅ Adequate | — |
| TC-SUP-ORDER-016 | Block Unauthorized Access to API | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/auth.spec.ts` |
| TC-SUP-ORDER-017 | API Input Validation Errors | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/validation.spec.ts` |
| TC-SUP-ORDER-018 | Loading States Display | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/loading-state.spec.ts` |
| TC-SUP-ORDER-019 | Manual Restocking Orders | reviewed | ✅ Adequate | — |
| TC-SUP-ORDER-020 | Error Toast on Failed Operations | needs-fix | ⚠️ if-guard wraps all meaningful assertions | `tests/e2e/supplier-orders/error-toast.spec.ts` |
| TC-SUP-ORDER-021 | Reject Invalid variantId | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/invalid-variant.spec.ts` |
| TC-SUP-ORDER-022 | Validate Quantity Constraints | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/quantity-constraints.spec.ts` |
| TC-SUP-ORDER-023 | Sanitize Note Field Against XSS | needs-fix | ⚠️ API storage only; UI render not tested | `tests/e2e/supplier-orders/xss-note.spec.ts` |
| TC-SUP-ORDER-024 | Handle Past Expected Dates | needs-fix | 🔴 False Positive (sole assertion is toBeTruthy) | `tests/e2e/supplier-orders/past-expected-date.spec.ts` |
| TC-SUP-ORDER-025 | Set Timestamps Only on First Transition | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/timestamps.spec.ts` |
| TC-SUP-ORDER-026 | Handle Very Large Quantities | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/large-quantities.spec.ts` |
| TC-SUP-ORDER-027 | Handle Special Characters in Search | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/special-chars.spec.ts` |
| TC-SUP-ORDER-028 | Rapid Status Changes Data Consistency | reviewed | ✅ Adequate | `tests/e2e/supplier-orders/rapid-status.spec.ts` |

## Expenses

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-EXP-001 | Expense List Display | needs-fix | ⚠️ Duplicated in expense-crud.spec.ts; heading-only assertion | `tests/e2e/expenses/list.spec.ts` |
| TC-EXP-002 | Expense Create | needs-fix | ⚠️ Duplicated byte-for-byte in expense-crud.spec.ts | `tests/e2e/expenses/create.spec.ts` |
| TC-EXP-003 | Expense Validation | needs-fix | ⚠️ Triplicated across 3 files | `tests/e2e/expenses/validation.spec.ts` |
| TC-EXP-004 | Expense Edit Flow | missing | 🔴 Not Tested | *(spec to be created)* |
| TC-EXP-005 | Expense Delete Flow | missing | 🔴 Not Tested | *(spec to be created)* |

## Users

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-USER-001 | Create Internal User | needs-fix | ⚠️ Duplicated in user-management.spec.ts | `tests/e2e/users/create.spec.ts` |
| TC-USER-002 | Update User Profile & Role | needs-fix | ⚠️ Role badge assertion conditional | `tests/e2e/users/update.spec.ts` |
| TC-USER-003 | Deactivate User Blocks Access | needs-fix | ⚠️ Tests cookie clearing not deactivation | `tests/e2e/users/deactivate.spec.ts` |
| TC-USER-004 | Create User Validation Errors | needs-fix | ⚠️ Duplicated in user-management.spec.ts | `tests/e2e/users/validation.spec.ts` |
| TC-USER-005 | Reactivate User Restores Access | needs-fix | ⚠️ No API-level verify; duplicated | `tests/e2e/users/reactivate.spec.ts` |

## Dashboard

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-DASH-001 | Dashboard Metrics Verification | draft | — | — |
| TC-DASH-002 | Dashboard KPI Calculations | needs-fix | ⚠️ `>=` not exact delta; UI/API not cross-verified | `tests/e2e/dashboard/kpi-calculation.spec.ts` |
| TC-DASH-003 | Order Status Widget Counts | reviewed | ✅ Adequate | `tests/e2e/dashboard/order-status.spec.ts` |
| TC-DASH-004 | Top Products Widget | reviewed | ✅ Adequate | `tests/e2e/dashboard/widgets.spec.ts` |
| TC-DASH-005 | Low Stock Alerts | reviewed | ✅ Adequate | — |
| TC-DASH-006 | Recent Activities Feed | draft | — | — |
| TC-DASH-007 | Dashboard Load Performance | reviewed | ✅ Adequate | `tests/e2e/dashboard/performance.spec.ts` |
| TC-DASH-008 | Top Customers Widget | needs-fix | 🔴 False Positive (if-guard wraps only assertion) | `tests/e2e/dashboard/widgets.spec.ts` |
| TC-DASH-009 | Unread Chat Count Widget | reviewed | ✅ Adequate | `tests/e2e/dashboard/chat-count.spec.ts` |
| TC-DASH-010 | Dashboard Date Range Filter | needs-fix | 🔴 False Positive (duplicate ID + all blocks conditional) | `tests/e2e/dashboard/date-range.spec.ts` |
| TC-DASH-011 | Dashboard Empty State | reviewed | ✅ Adequate | `tests/e2e/dashboard/empty-state.spec.ts` |
| TC-DASH-012 | Dashboard KPI Exact Delta Verification | missing | 🔴 Not Tested | *(spec to be created)* |

## Accounting

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-ACC-001 | Expense Entry & P&L Calculation | needs-fix | ⚠️ Hardcoded month=1/year=2026 (historical) | `tests/e2e/accounting/pnl-calculation.spec.ts` |
| TC-ACC-002 | Cost Price History Logged | needs-fix | 🚫 Dead Code (navigates to /products, checks heading only) | `tests/e2e/accounting/cost-price-history.spec.ts` |
| TC-ACC-003 | Profit Calculation Uses Snapshot Cost | reviewed | ✅ Adequate | — |
| TC-ACC-004 | Report Date Range Validation | needs-fix | 🔴 False Positive (if-guard in finance-ui.spec.ts) | `tests/e2e/accounting/finance-ui.spec.ts` |
| TC-ACC-005 | Top Products by Profit | needs-fix | 🔴 False Positive (if-guard) | `tests/e2e/accounting/finance-ui.spec.ts` |
| TC-ACC-006 | Export Report to Excel | needs-fix | ⚠️ Duplicate ID across files; content not verified | `tests/e2e/accounting/export-report.spec.ts` |
| TC-ACC-007 | Cost Price Validation vs Selling Price | reviewed | ✅ Adequate | `tests/e2e/accounting/cost-price-validation.spec.ts` |
| TC-ACC-008 | Daily Report Totals | needs-fix | 🔴 False Positive (if-guard) | `tests/e2e/accounting/finance-ui.spec.ts` |
| TC-ACC-009 | Profit Margin Calculation | needs-fix | ⚠️ Final UI testid may not exist | `tests/e2e/accounting/profit-margin.spec.ts` |
| TC-ACC-010 | Expense Edit & Delete | draft | — | — |
| TC-ACC-011 | Profit Report Excludes Cancelled Orders | needs-fix | 🔴 False Positive (toBeLessThan instead of toBe(0)) | `tests/e2e/accounting/cancelled-orders.spec.ts` |
| TC-ACC-012 | Profit Report Date Range Boundaries | needs-fix | ⚠️ Hardcoded year=2026; outside-range not asserted absent | `tests/e2e/accounting/report-date-range-api.spec.ts` |
| TC-ACC-013 | Expense Amount Validation | needs-fix | ⚠️ Duplicate ID across expense-validation-api and expenses-ui | `tests/e2e/accounting/expense-validation-api.spec.ts` |
| TC-ACC-014 | Profit Report Empty State | reviewed | ✅ Adequate | `tests/e2e/accounting/finance-empty-state.spec.ts` |
| TC-ACC-015 | COGS Calculation Accuracy | missing | 🔴 Not Tested | *(spec to be created)* |

## Finance

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-FIN-001 | Finance Dashboard Load | reviewed | ✅ Adequate | `tests/e2e/finance/dashboard.spec.ts` |
| TC-FIN-002 | Finance Date Filters | needs-fix | 🔴 False Positive (zero assertions after clicking selects) | `tests/e2e/finance/filters.spec.ts` |
| TC-FIN-003 | Finance Filter Changes Displayed Data | missing | 🔴 Not Tested | *(spec to be created)* |

## Chat

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-CHAT-001 | Admin-Customer Chat Flow | needs-fix | 🚫 Dead Code (broken STOREFRONT_BASE_URL import) | `tests/e2e/chat/admin-flow.spec.ts` |
| TC-CHAT-002 | Guest Identification & Room Creation | needs-fix | 🚫 Dead Code (broken import) | `tests/e2e/chat/guest-identification.spec.ts` |
| TC-CHAT-003 | Admin Inbox - Unread Count & Sorting | reviewed | ✅ Adequate | `tests/e2e/chat/admin-inbox.spec.ts` |
| TC-CHAT-004 | Real-time Text Messaging | reviewed | ✅ Adequate | `tests/e2e/chat/admin-messaging.spec.ts` |
| TC-CHAT-005 | Image Upload Validation | needs-fix | 🔴 False Positive (toBe(500) for MIME rejection) | `tests/e2e/chat/admin-messaging.spec.ts` |
| TC-CHAT-006 | Mark Messages as Read | needs-fix | 🔴 False Positive (if-guard; button.first() too generic) | `tests/e2e/chat/admin-messaging.spec.ts` |
| TC-CHAT-007 | Message History Pagination | needs-fix | ⚠️ Uses `name:` not `fullName:`; roomId becomes undefined | `tests/e2e/chat/message-history.spec.ts` |
| TC-CHAT-008 | Reuse Chat Room by Phone | needs-fix | 🚫 Dead Code (broken import) | `tests/e2e/chat/room-reuse.spec.ts` |
| TC-CHAT-009 | Message Validation | reviewed | ✅ Adequate | `tests/e2e/chat/message-validation.spec.ts` |
| TC-CHAT-010 | Guest Cannot Access Admin Chat Routes | reviewed | ✅ Adequate | `tests/e2e/chat/access-control.spec.ts` |
| TC-CHAT-011 | Concurrent Send and Mark-as-Read | reviewed | ✅ Adequate | `tests/e2e/chat/concurrency.spec.ts` |
| TC-CHAT-012 | Concurrent Messages Order Consistency | reviewed | ✅ Adequate | `tests/e2e/chat/concurrency.spec.ts` |
| TC-CHAT-013 | Attachment Upload Valid File Baseline | missing | 🔴 Not Tested | *(spec to be created)* |
| TC-CHAT-014 | Guest Session Expiry and Re-Identification | missing | 🔴 Not Tested | *(spec to be created)* |

## Analytics

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-ANALYTIC-001 | Analytics Overview Load | needs-fix | ⚠️ Only checks page loads; no data accuracy | `tests/e2e/analytics/overview.spec.ts` |
| TC-ANALYTIC-002 | Analytics Report Export | needs-fix | 🔴 False Positive (download conditional; content not verified) | `tests/e2e/analytics/report-export.spec.ts` |

## Integration

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-INT-001 | Create Product then Create Order | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-002 | Multi-Product Order (In-stock + Pre-order) | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-003 | Multi-Product Order with Out-of-Stock Item | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-004 | Order Creates Customer and Updates History | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-005 | Payment Updates Order Status and Dashboard KPIs | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-006 | Supplier Order Received Unlocks Shipping | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-007 | Order Cancel Restores Stock and Updates Dashboard | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-008 | Cancel Paid Order Updates Accounting Totals | needs-fix | ⚠️ Hardcoded month=1/year=2026 | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-009 | Concurrent Orders for Same Stock | needs-fix | ⚠️ Negative stock accepted; range -3 unexplained | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-010 | Double-Submit Create Order Prevented | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-011 | Retry After Create Order Failure | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-012 | Concurrent Payment Submissions | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-013 | Concurrent Supplier Order Status Update | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-014 | Order Creation Transaction Rollback | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-015 | Manual Stock Increase Reflects in Catalog | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-016 | Idempotent Create Order by Client Token | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-017 | Idempotent Create Order with Different Payload | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-018 | Idempotent Add Payment by Client Token | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-019 | Idempotent Add Payment with Different Payload | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |
| TC-INT-020 | Idempotent Cancel Order Request | reviewed | ✅ Adequate | `tests/e2e/integration/integration.spec.ts` |

## Accessibility

| ID | Title | Status | Review | Spec File |
|----|-------|--------|--------|-----------|
| TC-A11Y-001 | Storefront Accessibility Scan | missing | 🔴 Not Tested | *(spec to be created)* |
