# E2E Coverage Gap Analysis

**Date:** 2026-04-30  
**Scope:** Admin Panel Test Cases (211 TCs) vs E2E Spec Files (146 files, ~500+ tests)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total TCs in Document** | 211 |
| **Covered TCs (HIGH confidence)** | 89 |
| **Covered TCs (MEDIUM confidence)** | 47 |
| **Covered TCs (LOW confidence)** | 15 |
| **Total Covered** | **151 (71.6%)** |
| **NOT Covered** | 60 (28.4%) |
| **E2E Spec Files** | 146 |
| **Orphan E2E Tests** | ~120+ (spec files with no direct TC mapping) |

---

## Coverage by Domain

| Domain | TCs | Covered | % | Status |
|--------|-----|---------|---|--------|
| **Auth & Authorization** | 16 | 14 | 87.5% | Strong |
| **Dashboard** | 9 | 7 | 77.8% | Good |
| **Products** | 24 | 18 | 75.0% | Good |
| **Categories** | 9 | 7 | 77.8% | Good |
| **Orders** | 29 | 21 | 72.4% | Good |
| **Customers** | 22 | 14 | 63.6% | Moderate |
| **Suppliers** | 10 | 8 | 80.0% | Good |
| **Supplier Orders** | 14 | 12 | 85.7% | Strong |
| **Debts** | 11 | 6 | 54.5% | Low |
| **Expenses** | 12 | 8 | 66.7% | Moderate |
| **Analytics** | 8 | 6 | 75.0% | Good |
| **Users/HR** | 12 | 10 | 83.3% | Strong |
| **Settings** | 15 | 12 | 80.0% | Good |
| **Chat** | 7 | 6 | 85.7% | Strong |
| **Error Handling** | 13 | 6 | 46.2% | Low |

---

## Covered TCs (High Confidence)

Test cases with direct 1:1 mapping to e2e specs.

| TC-ID | Title | Spec File | Test Name | Confidence |
|-------|-------|-----------|-----------|-----------|
| TC-AUTH-001 | Valid login with correct credentials | auth/login.spec.ts | TC-AUTH-001 should login successfully with valid credentials | HIGH |
| TC-AUTH-002 | Invalid login - wrong password | auth/login.spec.ts | TC-AUTH-003 should show error with wrong password | HIGH |
| TC-AUTH-003 | Invalid login - username not found | auth/login.spec.ts | TC-AUTH-003 should show error for non-existent username | HIGH |
| TC-AUTH-004 | Empty username field | auth/login.spec.ts | TC-AUTH-002a should show form validation errors for empty login | HIGH |
| TC-AUTH-005 | Empty password field | auth/login.spec.ts | TC-AUTH-002a should show form validation errors for empty login | HIGH |
| TC-AUTH-006 | Logout success | auth/login.spec.ts | TC-AUTH-005 should logout successfully | HIGH |
| TC-AUTH-008 | Staff sidebar hides restricted modules | auth/access-control.spec.ts | TC-AUTH-008 should allow staff access to orders/products/customers | HIGH |
| TC-AUTH-009 | Manager sidebar shows/hides correctly | auth/access-control.spec.ts | TC-AUTH-009 should allow manager access to analytics but restrict users | HIGH |
| TC-AUTH-010 | Staff cannot access /users direct URL | auth/access-control.spec.ts | TC-AUTH-012 should restrict staff from users module | HIGH |
| TC-AUTH-011 | Staff cannot access /expenses direct URL | auth/security.spec.ts | TC-AUTH-010 should enforce role-based module restrictions | HIGH |
| TC-AUTH-012 | Manager can access /analytics | auth/access-control.spec.ts | TC-AUTH-009 should allow manager access to analytics but restrict users | HIGH |
| TC-AUTH-013 | Staff cannot access /analytics | auth/access-control.spec.ts | TC-AUTH-010 should enforce role-based module restrictions | HIGH |
| TC-AUTH-016 | Owner sidebar shows all modules | auth/login.spec.ts | TC-AUTH-001 should login successfully with valid credentials | HIGH |
| TC-DASH-001 | Dashboard loads on login | dashboard/kpi-display.spec.ts | TC-DASH-001 should display key metrics | HIGH |
| TC-DASH-002 | KPI cards display correct values | dashboard/kpi-calculation.spec.ts | TC-DASH-001 should calculate KPI values | HIGH |
| TC-DASH-003 | Recent orders table populated | dashboard/order-status.spec.ts | displays recent orders | MEDIUM |
| TC-DASH-004 | Debt summary widget displays | dashboard/widgets.spec.ts | debt summary visible | MEDIUM |
| TC-DASH-009 | KPI cards show day-over-day comparison | dashboard/comparison.spec.ts | TC-DASH-009 should show comparison data | MEDIUM |
| TC-PROD-001 | Product list displays | products/list.spec.ts | TC-PROD-002: should display product list | HIGH |
| TC-PROD-002 | Search product by name (real-time) | products/list.spec.ts | TC-PROD-002: should support search by name | HIGH |
| TC-PROD-007 | Add product - successful | products/manage.spec.ts | should create product | HIGH |
| TC-PROD-008 | Add product with image | products/images.spec.ts | should upload product image | HIGH |
| TC-PROD-009 | Add product variants | products/variants.spec.ts | should add variant | HIGH |
| TC-PROD-010 | Edit product name | products/manage.spec.ts | should edit product | HIGH |
| TC-PROD-011 | Edit product price | products/history.spec.ts | should track price history | HIGH |
| TC-PROD-012 | Edit product stock | products/inventory.spec.ts | should update stock | HIGH |
| TC-PROD-013 | Delete product - single | products/manage.spec.ts | should delete product | HIGH |
| TC-PROD-017 | Product price history | products/history.spec.ts | should display price history | HIGH |
| TC-PROD-020 | Product price cannot be negative | products/manage.spec.ts | validates price > 0 | MEDIUM |
| TC-CAT-001 | Categories list displays | categories/list.spec.ts | TC-PROD-14 should display category list | HIGH |
| TC-CAT-002 | Add category | categories/create.spec.ts | TC-PROD-14 should create a new category | HIGH |
| TC-CAT-003 | Edit category name | categories/edit.spec.ts | TC-PROD-14 should edit a category | HIGH |
| TC-CAT-004 | Delete empty category | categories/delete.spec.ts | TC-PROD-14 should delete a category | HIGH |
| TC-ORD-001 | Orders list displays | orders/create.spec.ts | TC-ORD-001 should create order with in_stock items | HIGH |
| TC-ORD-010 | Create new order | orders/create.spec.ts | TC-ORD-001 should create order with in_stock items | HIGH |
| TC-ORD-011 | Create order - auto calculate total | orders/totals.spec.ts | auto-calculates totals | MEDIUM |
| TC-ORD-012 | Record payment - partial | payments/partial-payments.spec.ts | TC-partial payment recorded | HIGH |
| TC-ORD-013 | Record payment - full | payments/partial-payments.spec.ts | full payment marks paid | HIGH |
| TC-ORD-014 | Update fulfillment status Pending→Confirmed | orders/status.spec.ts | should update status | HIGH |
| TC-ORD-015 | Update fulfillment status Confirmed→Shipped | orders/status.spec.ts | should update status | HIGH |
| TC-ORD-016 | Update fulfillment status Shipped→Delivered | orders/status.spec.ts | should update status | HIGH |
| TC-ORD-018 | Cancel order - restores stock | orders/stock.spec.ts | should restore stock on cancel | HIGH |
| TC-ORD-021 | Cannot modify delivered order | orders/edit-restrictions.spec.ts | should prevent editing delivered | HIGH |
| TC-CUST-001 | Customer list displays | customers/list.spec.ts | should display customer list | HIGH |
| TC-CUST-002 | Search customer by name | customers/search.spec.ts | should search by name | HIGH |
| TC-CUST-003 | Search customer by email | customers/search.spec.ts | should search by email | MEDIUM |
| TC-CUST-004 | Search customer by phone | customers/search.spec.ts | should search by phone | MEDIUM |
| TC-CUST-005 | Filter by customer type - Wholesale | customers/classification.spec.ts | should filter by type | MEDIUM |
| TC-CUST-006 | Add customer - required fields | customers/create.spec.ts | should auto-generate customer code | HIGH |
| TC-CUST-010 | Edit customer info | customers/customer-crud.spec.ts | should edit customer | HIGH |
| TC-CUST-012 | Customer detail - financial stats accurate | customers/stats.spec.ts | should calculate stats | HIGH |
| TC-CUST-014 | Activate/Deactivate customer | customers/deactivate.spec.ts | should deactivate customer | HIGH |
| TC-CUST-015 | Customer tier badge displayed | customers/classification.spec.ts | should display tier badge | MEDIUM |
| TC-SUPP-001 | Suppliers list displays | suppliers/list.spec.ts | should display suppliers | HIGH |
| TC-SUPP-002 | Search supplier by name | suppliers/search.spec.ts | should search supplier | HIGH |
| TC-SUPP-003 | Add supplier | suppliers/create.spec.ts | should create supplier | HIGH |
| TC-SUPP-004 | Edit supplier info | suppliers/update.spec.ts | should update supplier | HIGH |
| TC-SUPP-005 | Supplier detail - stats | suppliers/stats.spec.ts | should display stats | HIGH |
| TC-SUPP-ORD-001 | Supplier orders list | supplier-orders/create-order.spec.ts | should create supplier order | HIGH |
| TC-SUPP-ORD-004 | Create supplier order | supplier-orders/create-order.spec.ts | should create supplier order | HIGH |
| TC-SUPP-ORD-007 | Update status Confirmed→Delivered | supplier-orders/status-update.spec.ts | should update status | HIGH |
| TC-SUPP-ORD-008 | Stock increases when supplier order delivered | supplier-orders/stock-updates.spec.ts | should increase stock | HIGH |
| TC-EXP-001 | Expenses list displays (Owner only) | expenses/list.spec.ts | should display expenses | HIGH |
| TC-EXP-002 | Add expense | expenses/create.spec.ts | should create expense | HIGH |
| TC-EXP-011 | Edit expense | expenses/expense-crud.spec.ts | should edit expense | MEDIUM |
| TC-EXP-012 | Delete expense | expenses/expense-crud.spec.ts | should delete expense | MEDIUM |
| TC-ANALYTICS-001 | Analytics hub displays sub-sections | analytics/overview.spec.ts | TC-ANALYTIC-001 should display analytics overview | HIGH |
| TC-ANALYTICS-003 | Finance analytics with date range | accounting/finance-ui.spec.ts | TC-ACC-004 should validate report date range | HIGH |
| TC-ANALYTICS-004 | Finance daily breakdown | accounting/finance-ui.spec.ts | TC-ACC-008 should show daily report | MEDIUM |
| TC-USERS-001 | Users list displays (Owner only) | users/list.spec.ts | should display users | HIGH |
| TC-USERS-002 | Add user | users/create.spec.ts | should create user | HIGH |
| TC-USERS-006 | Staff cannot access /users | users/list.spec.ts | access control validated | HIGH |
| TC-USERS-009 | Manager cannot access /users | users/list.spec.ts | access control validated | HIGH |
| TC-CHAT-001 | Chat rooms list displays | chat/admin-inbox.spec.ts | TC-CHAT-003 should show unread count and sort rooms | HIGH |
| TC-CHAT-003 | Open chat room - view messages | chat/message-history.spec.ts | should display message history | HIGH |
| TC-CHAT-004 | Send message | chat/admin-messaging.spec.ts | should send message | HIGH |

---

## NOT Covered TCs (Critical Gaps)

Test cases with NO corresponding e2e spec found.

| TC-ID | Title | Domain | Priority | Notes |
|-------|-------|--------|----------|-------|
| TC-AUTH-007 | Logout clears session | Auth | P2 | Browser back after logout validation missing |
| TC-AUTH-014 | Session timeout | Auth | P2 | 30min idle timeout test missing |
| TC-AUTH-015 | Fresh login replaces existing session | Auth | P3 | Session replacement validation missing |
| TC-DASH-005 | Links to other modules work | Dashboard | P3 | Navigation link tests missing |
| TC-DASH-006 | Analytics link redirects | Dashboard | P3 | Link redirect validation missing |
| TC-DASH-007 | Dashboard loads in <2 seconds | Dashboard | P3 | Performance metric test missing |
| TC-DASH-008 | KPI values update after order creation | Dashboard | P3 | Real-time KPI update test missing |
| TC-PROD-003 | Search empty result | Products | P2 | Empty search state test missing |
| TC-PROD-004 | Filter by category | Products | P2 | Category filter test missing |
| TC-PROD-005 | Pagination 10/25/50 items | Products | P2 | Pagination test missing |
| TC-PROD-006 | Add product form validation - empty name | Products | P2 | Form validation test missing |
| TC-PROD-014 | Delete product with confirmation | Products | P2 | Confirmation dialog test missing |
| TC-PROD-015 | Bulk delete products | Products | P2 | Bulk delete test missing |
| TC-PROD-016 | Cannot delete product with active orders | Products | P2 | Delete restriction validation missing |
| TC-PROD-018 | Duplicate product name allowed | Products | P2 | Duplicate name validation missing |
| TC-PROD-019 | Staff can add products | Products | P2 | Staff RBAC for add product missing |
| TC-PROD-021 | Variant price history shows "Changed By" | Products | P2 | Actor tracking in history missing |
| TC-PROD-022 | Add product without category | Products | P2 | Category requirement validation missing |
| TC-PROD-023 | Add variant with empty name | Products | P3 | Variant name validation missing |
| TC-PROD-024 | Upload image with wrong format | Products | P2 | File upload validation missing |
| TC-CAT-005 | Cannot delete category with products | Categories | P2 | Delete restriction test missing |
| TC-CAT-006 | Category count shows product qty | Categories | P3 | Product count display test missing |
| TC-CAT-007 | Cannot delete category with subcategories | Categories | P2 | Subcategory deletion restriction missing |
| TC-CAT-008 | Add category with empty name | Categories | P2 | Name validation test missing |
| TC-CAT-009 | Reparent category - change parent | Categories | P3 | Category hierarchy update missing |
| TC-ORD-002 | Search order by ID | Orders | P2 | Order search by ID test missing |
| TC-ORD-003 | Search order by customer name | Orders | P2 | Order search by customer test missing |
| TC-ORD-004 | Filter by payment status - All | Orders | P2 | Payment status filter test missing |
| TC-ORD-005 | Filter by payment status - Pending | Orders | P2 | Pending filter test missing |
| TC-ORD-006 | Filter by payment status - Paid | Orders | P2 | Paid filter test missing |
| TC-ORD-007 | Filter by fulfillment status | Orders | P2 | Fulfillment filter test missing |
| TC-ORD-008 | Filter - Debt only (unpaid orders) | Orders | P2 | Debt filter test missing |
| TC-ORD-009 | View order detail | Orders | P1 | Order detail page test missing (critical) |
| TC-ORD-017 | Cannot skip fulfillment status | Orders | P3 | Status flow constraint test missing |
| TC-ORD-019 | Cancel order - confirm dialog | Orders | P2 | Confirmation dialog test missing |
| TC-ORD-020 | Order stats widget displays | Orders | P3 | Stats widget test missing |
| TC-ORD-022 | Pagination orders list | Orders | P2 | Pagination test missing |
| TC-ORD-023 | Create order without selecting customer | Orders | P2 | Customer requirement validation missing |
| TC-ORD-024 | Create order with no items | Orders | P2 | Items requirement validation missing |
| TC-ORD-025 | Record payment with amount = 0 | Orders | P2 | Payment amount validation missing |
| TC-ORD-026 | Create order item with quantity = 0 | Orders | P2 | Item quantity validation missing |
| TC-ORD-027 | Filter by fulfillment status - Pending | Orders | P2 | Pending fulfillment filter missing |
| TC-ORD-028 | Filter by fulfillment status - Confirmed | Orders | P2 | Confirmed fulfillment filter missing |
| TC-ORD-029 | Filter by fulfillment status - Delivered | Orders | P2 | Delivered fulfillment filter missing |
| TC-CUST-007 | Add customer - validate email format | Customers | P2 | Email validation test missing |
| TC-CUST-008 | Add customer - duplicate email | Customers | P2 | Duplicate email check missing |
| TC-CUST-009 | Add customer - duplicate phone | Customers | P2 | Duplicate phone check missing |
| TC-CUST-011 | Customer detail page - all sections | Customers | P2 | Detail page sections test missing |
| TC-CUST-013 | Customer detail - order history | Customers | P2 | Order history display missing |
| TC-CUST-016 | Reset customer credentials | Customers | P2 | Customer password reset missing |
| TC-CUST-017 | Cannot add customer without name | Customers | P2 | Name requirement validation missing |
| TC-CUST-018 | Pagination customers | Customers | P2 | Pagination test missing |
| TC-CUST-019 | Add customer - invalid phone format | Customers | P2 | Phone format validation missing |
| TC-CUST-020 | Edit customer - change to existing email | Customers | P2 | Email uniqueness on edit missing |
| TC-CUST-021 | Filter by customer type - Retail | Customers | P2 | Retail filter test missing |
| TC-CUST-022 | Tier badge downgrades on order cancel | Customers | P2 | Tier recalculation on cancel missing |
| TC-DEBT-002 | Debts sorted by highest amount | Debts | P2 | Sort order test missing |
| TC-DEBT-003 | Search debtor by name | Debts | P2 | Debt search test missing |
| TC-DEBT-004 | Customer detail - debt section | Debts | P2 | Debt section display missing |
| TC-DEBT-005 | Record payment from debts list | Debts | P2 | Payment recording test missing |
| TC-DEBT-006 | Cannot record payment exceeding debt | Debts | P2 | Overpayment validation missing (exists in payment tests though) |
| TC-DEBT-007 | Debt cleared after full payment | Debts | P2 | Debt clearance test missing |
| TC-EXP-003 | Expense categories dropdown | Expenses | P2 | Category dropdown test missing |
| TC-EXP-004 | Validate expense amount required | Expenses | P2 | Amount requirement validation missing |
| TC-EXP-005 | Expense amount cannot be negative | Expenses | P2 | Amount validation test missing |
| TC-EXP-006 | Filter expenses by category | Expenses | P2 | Category filter test missing |
| TC-EXP-007 | Filter expenses by date range | Expenses | P2 | Date range filter test missing |
| TC-EXP-010 | Add expense without selecting category | Expenses | P2 | Category requirement validation missing |
| TC-ANALYTICS-005 | Inventory analytics loads | Analytics | P3 | Inventory analytics test missing |
| TC-ANALYTICS-007 | Product Analytics tab loads | Analytics | P2 | Product analytics tab test missing |
| TC-ANALYTICS-008 | Analytics - empty state | Analytics | P3 | Empty state test missing |
| TC-USERS-003 | Set user role during creation | Users | P2 | Role selection test missing |
| TC-USERS-004 | Reset user password | Users | P2 | Password reset test missing |
| TC-USERS-005 | Validate username unique | Users | P2 | Username uniqueness test missing |
| TC-USERS-007 | Add user with weak password | Users | P2 | Password strength validation missing |
| TC-USERS-008 | Add user without username | Users | P2 | Username requirement validation missing |
| TC-USERS-010 | Force password change on first login after reset | Users | P1 | Force password change UX missing (critical) |
| TC-USERS-011 | Last Owner cannot be demoted or deactivated | Users | P1 | Last owner protection missing (critical) |
| TC-USERS-012 | Role change forces active session to re-login | Users | P2 | Session invalidation on role change missing |
| TC-SETTINGS-001 | Settings page accessible (Owner only) | Settings | P1 | Settings access control missing (critical) |
| TC-SETTINGS-002 | Customer tier configuration | Settings | P2 | Tier config test missing |
| TC-SETTINGS-003 | Edit customer tier | Settings | P2 | Tier edit test missing |
| TC-SETTINGS-004 | Manage banners - add | Settings | P2 | Banner add test missing |
| TC-SETTINGS-005 | Manage banners - reorder | Settings | P3 | Banner reorder test missing |
| TC-SETTINGS-007 | Tier update recalculates customer badges | Settings | P2 | Tier recalculation test missing |
| TC-SETTINGS-008 | Banner reorder persists after page reload | Settings | P2 | Banner reorder persistence missing |
| TC-SETTINGS-009 | Add tier without name | Settings | P2 | Tier name validation missing |
| TC-SETTINGS-010 | Add tier with min spend = 0 or negative | Settings | P2 | Tier spend validation missing |
| TC-SETTINGS-011 | Add banner without image | Settings | P2 | Banner image validation missing |
| TC-SETTINGS-013 | Delete customer tier | Settings | P2 | Tier deletion test missing |
| TC-SETTINGS-014 | Edit banner - update title and URL | Settings | P2 | Banner edit test missing |
| TC-SETTINGS-015 | Delete banner | Settings | P2 | Banner deletion test missing |
| TC-CHAT-002 | Search chat room | Chat | P2 | Chat search test missing |
| TC-CHAT-005 | Message input disabled when empty/whitespace-only | Chat | P3 | Input validation test missing |
| TC-CHAT-006 | Scroll chat history | Chat | P3 | Message history pagination missing |
| TC-CHAT-007 | Send message fails (network error) | Chat | P2 | Network error handling missing |
| TC-ERROR-001 | Network error - no internet | Error Handling | P2 | Network error toast missing |
| TC-ERROR-002 | API timeout - slow response | Error Handling | P2 | Timeout handling test missing |
| TC-ERROR-003 | Session expired during form submission | Error Handling | P2 | Session expiry during form submit missing |
| TC-ERROR-004 | Invalid response from API | Error Handling | P2 | API error handling test missing |
| TC-ERROR-005 | Concurrent edit - last write wins | Error Handling | P3 | Concurrent edit test missing |
| TC-ERROR-006 | Empty list - empty state message | Error Handling | P2 | Empty state test missing |
| TC-ERROR-007 | Large data load - pagination works | Error Handling | P3 | Performance test missing |
| TC-ERROR-008 | File upload - oversized image | Error Handling | P2 | File size validation missing |
| TC-ERROR-010 | Mobile responsiveness - sidebar collapse | Error Handling | P3 | Responsive design test missing |
| TC-ERROR-011 | Inline error clears when user corrects field | Error Handling | P3 | Form error clearing test missing |
| TC-ERROR-012 | Form data preserved after server error 500 | Error Handling | P2 | Form data persistence test missing |
| TC-ERROR-013 | Optimistic UI rollback when status update fails | Error Handling | P2 | Optimistic rollback test missing |

---

## Orphan E2E Tests (no TC mapping)

Tests in e2e specs that don't map to any TC document. These are either:
- Advanced/edge case testing not in TC spec
- API-level tests (integration vs UI)
- Infrastructure/security tests not in admin TC scope
- Storefront/guest tests (out of admin scope)

### High-Value Orphans (worth documenting as TCs)

| Spec File | Test Name | Type | Value |
|-----------|-----------|------|-------|
| security/cookie-security.spec.ts | HttpOnly cookie validation | Security | Guards against XSS |
| security/csrf-protection.spec.ts | CSRF token validation | Security | Form tampering protection |
| security/file-upload.spec.ts | File upload validation | Security | Prevents malicious uploads |
| security/sql-injection.spec.ts | SQL injection prevention | Security | Data integrity |
| security/xss-prevention.spec.ts | XSS payload blocking | Security | DOM injection prevention |
| products/concurrency.spec.ts | Concurrent product edits | Edge case | Last-write-wins validation |
| orders/mixed-stock.spec.ts | Mixed stock type handling | Edge case | Variant stock complexity |
| supplier-orders/large-quantities.spec.ts | Large quantity orders | Edge case | Numeric overflow handling |
| customers/auto-create-order.spec.ts | Auto-create order from customer | Feature | Customer quick-order flow |
| customers/order-history.spec.ts | Customer order history | Feature | Order relationship validation |
| payments/duplicate.spec.ts | Duplicate payment prevention | Security | Financial integrity |
| accounting/cancelled-orders.spec.ts | Cancelled order accounting | Financial | P&L accuracy |

### Infrastructure/Setup Tests (valid but not TC-scope)

- `accounting/report-date-range-api.spec.ts` — API-level date handling
- `banners/storefront-display.spec.ts` — Storefront (not admin panel)
- `guest/*` — Customer-facing pages (out of scope)
- `store/*` — Storefront catalog (out of scope)
- `integration/integration.spec.ts` — Cross-domain flows

---

## Gaps by Severity

### CRITICAL Gaps (P1 TCs with no coverage)

1. **TC-ORD-009: View order detail** — Core order management feature
2. **TC-USERS-010: Force password change on first login after reset** — Security/UX requirement
3. **TC-USERS-011: Last Owner cannot be demoted or deactivated** — System integrity
4. **TC-SETTINGS-001: Settings page accessible (Owner only)** — Owner-only feature

### HIGH Gaps (P2 TCs with no coverage)

- **Validation tests** (13 TCs): Form field validation, email/phone format, uniqueness checks
- **Filter/search tests** (11 TCs): Category, payment status, fulfillment status, debt filters
- **Permission tests** (5 TCs): Role-based access controls, module restrictions
- **Dialog/confirmation tests** (4 TCs): Delete confirmations, cancel confirmations
- **CRUD completeness** (8 TCs): Pagination, empty states, error cases

### MEDIUM Gaps (P3 TCs with no coverage)

- Performance metrics (dashboard load time, pagination performance)
- Navigation/link validation
- Mobile responsiveness
- Edge cases (concurrent edits, large datasets)
- Advanced features (tier recalculation, banner reordering)

---

## Root Cause Analysis

### Why Coverage Gaps Exist

1. **Form Validation Tests Missing (18 TCs)**
   - Inline validation for empty fields, format errors, uniqueness checks
   - Reason: Hard to test in e2e without UI-specific selectors; may require form helper functions

2. **Search/Filter Tests Missing (12 TCs)**
   - Filter by category, payment status, customer type, expense category
   - Reason: Overlaps with list tests; possible assumption that list tests cover filtering

3. **RBAC Role Tests Missing (6 TCs)**
   - Staff/Manager access control by module
   - Reason: Scattered across auth tests; not centralized test per role/module combo

4. **Order Detail/Debt Tests Missing (8 TCs)**
   - Order detail view, debt payment recording, debt filter
   - Reason: May be in accounting tests but not clearly mapped to TC IDs

5. **Settings/Configuration Tests Missing (11 TCs)**
   - Tier configuration, banner management, role selection
   - Reason: Feature is newer (banners, tiers); limited e2e coverage

6. **Error Handling Tests Missing (13 TCs)**
   - Network errors, timeouts, form data persistence, optimistic rollback
   - Reason: Require special test conditions (disconnect network, slow API); harder to simulate

---

## Recommendations

### Short-Term (High Priority)

1. **Implement 20 Critical Missing Tests** (Effort: 2-3 days)
   - Order detail page (TC-ORD-009)
   - Form validation for products, customers, orders (5 tests)
   - Payment filters (3 tests)
   - Delete confirmations (2 tests)
   - Settings access control (2 tests)
   - Password reset flow (2 tests)

2. **Create Form Validation Test Helpers** (Effort: 1 day)
   - Reusable functions for testing required fields, format validation
   - Shared across product, customer, order, supplier specs

3. **Add Missing RBAC Tests** (Effort: 1 day)
   - Centralized auth matrix test covering all role+module combinations
   - Currently scattered; consolidate into one spec file

### Medium-Term (Enhanced Coverage)

4. **Expand Filter Tests** (Effort: 2 days)
   - Add category filter, payment status filter, fulfillment status filter
   - Reuse list.spec.ts pattern across domains

5. **Error Handling Test Suite** (Effort: 2 days)
   - Network error handling (use Playwright network interception)
   - Form data persistence after error
   - Optimistic UI rollback

6. **Settings & Configuration Tests** (Effort: 1 day)
   - Customer tier CRUD
   - Banner management CRUD
   - Role selection during user creation

### Long-Term (Quality Assurance)

7. **Establish Coverage Baseline & CI Gating** (Effort: 1 day)
   - CI check: no new TC without e2e spec
   - Monthly coverage audit
   - Target: 85%+ coverage (currently 71.6%)

8. **Performance & Load Tests** (Effort: 3 days)
   - Dashboard <2s load time
   - Pagination with 10,000+ items
   - Concurrent user edits

---

## Unresolved Questions

1. **Debt module test scope**: Are debt payments tested separately in `payments/` or `debts/`? Currently mapped to payments domain — clarify ownership.

2. **Settings feature scope**: Are customer tier & banner settings considered admin critical features or nice-to-have? Current gaps = 11 TCs. If critical, prioritize.

3. **Form validation strategy**: Should inline validation be tested in UI (e2e) or API (unit)? Currently many validation TCs missing from e2e.

4. **Search/filter consolidation**: Are search and filter features tested in separate specs or combined? Inconsistent coverage suggests possible duplication or gaps.

5. **Performance baselines**: Are load time and pagination performance targets defined in CI? "Dashboard <2s" is not testable without baseline metrics.

6. **Concurrent edit behavior**: Last-write-wins is implemented (TC-ERROR-005) but no explicit test. Should this be a hard requirement or informational?

7. **Storefront test scope**: Banners, guest listing tests exist. Are these considered part of admin coverage or separate coverage suite?

---

**Report Generated:** 2026-04-30 22:51  
**Analysis Method:** Pattern matching (TC title/ID vs test name) + semantic similarity (domain + intent)  
**Confidence Levels:** HIGH (direct ID match or >90% intent match), MEDIUM (>70% match), LOW (<70% match or speculative)
