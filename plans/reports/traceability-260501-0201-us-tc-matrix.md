---
type: traceability
date: 2026-05-01
scope: admin-user-stories.md (44 US) ↔ admin-test-cases.md (206 TC)
status: complete
---

# US ↔ TC Traceability Matrix — K-SMART Admin Panel

**Legend:** ✅ Covered | ⚠️ Partial | ❌ Gap | 🔒 PO-blocked

---

## 1. Matrix (US → TCs)

| US ID | Title (VN abbrev) | Covering TCs | Status | Notes |
|-------|-------------------|--------------|--------|-------|
| **AUTH** | | | | |
| US-AUTH-001 | Đăng nhập | TC-AUTH-001..005 | ✅ | Full happy + error path |
| US-AUTH-002 | Session / timeout | TC-AUTH-006, 007, 014, 015 | ⚠️ | TC-AUTH-015 steps mismatch (clears cookies first; should verify server-side invalidation without cookie clear) |
| US-AUTH-003 | RBAC hiển thị | TC-AUTH-008..013, 016 | ✅ | All 3 roles sidebar + URL guard covered |
| **DASH** | | | | |
| US-DASH-001 | Dashboard loads | TC-DASH-001..006 | ⚠️ | TC-DASH-005/006 (quick-action links + analytics link) orphaned — no matching AC in US-DASH-001 |
| US-DASH-002 | Manager analytics | TC-AUTH-012 | ⚠️ | Only landing page verified; sub-tabs (Finance, Inventory, Product) not tested for Manager |
| US-DASH-003 | Profit calculation | TC-ANALYTICS-003, 004 | ❌ | No TC verifies profit = revenue − expenses formula explicitly |
| **PROD** | | | | |
| US-PROD-001 | Product list / search | TC-PROD-001..005 | ✅ | |
| US-PROD-002 | Add product | TC-PROD-006..009, 018..020, 022, 024 | ✅ | Some orphan constraints (neg price, category required, image format) lack explicit US ACs |
| US-PROD-003 | Edit product | TC-PROD-010..012 | ✅ | |
| US-PROD-004 | Delete product | TC-PROD-013..016 | ✅ | |
| US-PROD-005 | Price history | TC-PROD-017, 021 | ⚠️ | TC-PROD-017 uses "Old Cost / New Cost" while US says "Giá cũ / Giá mới"; cost vs price ambiguity — 🔒 PO |
| **CAT** | | | | |
| US-CAT-001 | Category list | TC-CAT-001, 006 | ✅ | |
| US-CAT-002 | Category CRUD | TC-CAT-002..005, 007..009 | ✅ | Cycle-prevention edge case (TC-CAT-009) present |
| **ORD** | | | | |
| US-ORD-001 | Order list / filters | TC-ORD-001..008, 020, 022 | ✅ | Shipped+Cancelled filter variants (ORD-027..029) added but scope is 🔒 |
| US-ORD-002 | Order detail | TC-ORD-009 | ⚠️ | Current payment status field not explicitly asserted in TC |
| US-ORD-003 | Create order | TC-ORD-010, 011, 023, 024, 026 | ✅ | |
| US-ORD-004 | Update status | TC-ORD-014..017, 021, 027..029 | ✅ | Actor ID format (fullName vs username) 🔒 PO |
| US-ORD-005 | Record payment | TC-ORD-012, 013, 025 | ✅ | |
| US-ORD-006 | Cancel order | TC-ORD-018, 019 | ✅ | |
| US-ORD-007 | Delivered = read-only | TC-ORD-021 | ✅ | Covered under US-ORD-004 |
| **CUST** | | | | |
| US-CUST-001 | Customer list | TC-CUST-001..005, 018, 021 | ✅ | |
| US-CUST-002 | Add customer | TC-CUST-006..009, 017, 019 | ⚠️ | Edit-to-existing-phone uniqueness not tested |
| US-CUST-003 | Edit / deactivate | TC-CUST-010, 014, 020 | ✅ | |
| US-CUST-004 | Customer credentials reset | TC-CUST-016 | ❌ | No force-change-on-first-login TC for customers (parallel to TC-USERS-010) — 🔒 PO |
| US-CUST-005 | Customer detail | TC-CUST-011..013 | ✅ | |
| US-CUST-006 | Tier badge | TC-CUST-015, 022 | ❌ | Tier upgrade eligibility display on detail page not covered; Staff role boundary unclear — 🔒 PO |
| **SUPP** | | | | |
| US-SUPP-001 | Supplier list + stats | TC-SUPP-001, 002 | ❌ | TC-SUPP-005 covers stats on detail page only; list-level stats (order count + total cost) not tested |
| US-SUPP-002 | Supplier CRUD | TC-SUPP-003..010 | ✅ | |
| **SUPP-ORD** | | | | |
| US-SUPP-ORD-001 | Supplier order list | TC-SUPP-ORD-001..003 | ✅ | |
| US-SUPP-ORD-002 | Create supplier order | TC-SUPP-ORD-004..006, 013, 014 | ✅ | Validation TCs added |
| US-SUPP-ORD-003 | Update status + history | TC-SUPP-ORD-007..012 | ❌ | No TC verifies actor name recorded in status change history |
| **DEBT** | | | | |
| US-DEBT-001 | Debt list | TC-DEBT-001..003 | ✅ | |
| US-DEBT-002 | Record debt payment | TC-DEBT-005..007 | ❌ | TC-DEBT-005 expected result doesn't assert payment method + note saved |
| US-DEBT-003 | Debt detail | TC-DEBT-004, 008..010 | ⚠️ | Role conflict: US says Owner/Manager only; TC-DEBT-009 grants Staff — 🔒 PO |
| **EXP** | | | | |
| US-EXP-001 | Expense CRUD | TC-EXP-001..010 | ⚠️ | Edit (TC-EXP-011) & Delete (TC-EXP-012) added in v2; scope 🔒 PO (Q19) |
| US-EXP-002 | Owner-only access | TC-EXP-008, 009 | ✅ | |
| **ANALYTICS** | | | | |
| US-ANALYTICS TCs | Analytics hub | TC-ANALYTICS-001..008 | ✅ | Via US-DASH-002/003; no dedicated US-ANALYTICS-* stories |
| **HR** | | | | |
| US-HR-001 | User list + status | TC-USERS-001 | ⚠️ | No TC for activate/deactivate admin user (parallel to TC-CUST-014) |
| US-HR-002 | Add user | TC-USERS-002..005, 007, 008 | ✅ | Password policy not in US AC |
| US-HR-003 | Reset password | TC-USERS-004, 010..012 | ✅ | |
| **SETTINGS** | | | | |
| US-SETTINGS-001 | Customer tier config | TC-SETTINGS-001..003, 006, 007, 009, 010, 012..013 | ✅ | |
| US-SETTINGS-002 | Banner management | TC-SETTINGS-004, 005, 008, 011, 014, 015 | ✅ | Banner position values spec 🔒 PO |
| **CHAT** | | | | |
| US-CHAT-001 | Inbox / unread count | TC-CHAT-001, 002 | ❌ | No TC verifies unread count decrements when room opened or new message marks unread |
| US-CHAT-002 | Messaging | TC-CHAT-003..007 | ✅ | |
| **CROSS** | | | | |
| US-CROSS-001 | Cross-cutting concerns | TC-ERROR-001..013 + RBAC redirect TCs | ✅ | Inline error trigger (onBlur/onChange) 🔒 PO |

---

## 2. Orphan TCs (no explicit US AC)

TCs that exist without a backing AC in any US. All are valid behaviors but AC should be added to corresponding US for completeness.

| TC-ID | Behavior | Recommended US to add AC |
|-------|----------|--------------------------|
| TC-AUTH-007 | Browser back after logout stays on /login | US-AUTH-002 |
| TC-AUTH-016 | Owner sees all 13 modules | US-AUTH-003 |
| TC-DASH-005 | Dashboard quick-action links (kho/products) | US-DASH-001 |
| TC-DASH-006 | "Xem báo cáo đầy đủ" analytics link | US-DASH-001 or US-DASH-002 |
| TC-PROD-020 | Price cannot be negative | US-PROD-002 |
| TC-PROD-022 | Category optional on add | US-PROD-002 |
| TC-PROD-024 | Wrong image format rejected | US-PROD-002 |
| TC-ORD-026 | Item quantity = 0 rejected | US-ORD-003 |
| TC-SUPP-007 | Duplicate supplier name allowed | US-SUPP-002 |
| TC-SUPP-ORD-011 | Cancel supplier order rules | US-SUPP-ORD-003 |
| TC-SUPP-ORD-012 | Cancel delivered supplier order rules | US-SUPP-ORD-003 |
| TC-SUPP-ORD-013 | Quantity > 0 validation | US-SUPP-ORD-002 |
| TC-SUPP-ORD-014 | Cost > 0 validation | US-SUPP-ORD-002 |
| TC-DEBT-006 | Cannot overpay debt | US-DEBT-002 |
| TC-EXP-005 | Expense amount cannot be negative | US-EXP-001 |
| TC-USERS-007 | Weak password rejected | US-HR-002 |
| TC-SETTINGS-007 | Tier update recalculates customer badges | US-SETTINGS-001 |
| TC-CHAT-005 | Send disabled on empty/whitespace | US-CHAT-002 |
| TC-CHAT-007 | Send fails on network error | US-CROSS-001 |
| TC-ERROR-002 | API timeout 30s+ | US-CROSS-001 |
| TC-ERROR-005 | Concurrent edit — last write wins | US-CROSS-001 (TBD/🔒) |
| TC-ERROR-006 | Empty list state | US-CROSS-001 |
| TC-ERROR-007 | Large data pagination (10k+) | US-CROSS-001 |
| TC-ERROR-008 | Oversized image upload | US-PROD-002 / US-SETTINGS-002 |
| TC-CUST-020 | Edit customer — change to existing email | US-CUST-002 |

---

## 3. Coverage Summary

| Metric | Count |
|--------|-------|
| Total User Stories | 44 |
| Total Test Cases | 206 |
| US fully covered ✅ | 28 (63.6%) |
| US partially covered ⚠️ | 9 (20.5%) |
| US with gap ❌ | 7 (15.9%) |
| Orphan TCs (no US AC) | 25 |
| PO-blocked items | 19 |

---

## 4. Gap Summary (❌ US with no coverage)

| US ID | Missing TC | Recommended Action |
|-------|-----------|-------------------|
| US-DASH-003 | Profit formula verification | Add TC-ANALYTICS-009 "profit = revenue − expenses" |
| US-CUST-004 | Force-change-on-login after customer credential reset | Add TC-CUST-022 (parallel to TC-USERS-010) — 🔒 PO first |
| US-CUST-006 | Tier eligibility display on customer detail | Add TC-CUST-023 — 🔒 PO (Staff role boundary) |
| US-SUPP-001 | Supplier list-level stats | Add TC-SUPP-011 |
| US-SUPP-ORD-003 | Actor name in status history | Add TC-SUPP-ORD-015 |
| US-DEBT-002 | Payment method + note saved | Extend TC-DEBT-005 expected result |
| US-CHAT-001 | Unread count behavior | Add TC-CHAT-008 |

---

## 5. Partial Coverage — Action Items

| US ID | Issue | Fix |
|-------|-------|-----|
| US-AUTH-002 | TC-AUTH-015 clears cookies before test (wrong setup) | Rewrite: don't clear cookies; verify server-side 401 on old session token |
| US-DASH-001 | TC-DASH-005/006 orphaned (no AC) | Add ACs to US-DASH-001 for quick-action links and analytics link |
| US-DASH-002 | Manager sub-tab access (Finance/Inventory/Product Analytics) untested | Extend TC-AUTH-012 or add TC-AUTH-017 |
| US-PROD-005 | "Cost" vs "Price" in history — TC vs US mismatch | 🔒 PO to clarify; add TBD note to TC-PROD-017 |
| US-ORD-002 | Current payment status field not asserted in TC-ORD-009 | Extend TC-ORD-009 expected result |
| US-CUST-002 | Edit-to-existing-phone uniqueness not tested | Add TC-CUST-025 or extend TC-CUST-020 |
| US-DEBT-003 | Staff access to /debts conflicts with US (Owner/Manager only) | 🔒 PO — TC-DEBT-009 is TBD |
| US-EXP-001 | Edit/delete TCs (TC-EXP-011/012) added but scope PO-blocked | Accept current state; confirm with PO (Q19) |
| US-HR-001 | Activate/deactivate admin user TC missing | Add TC-USERS-013 (parallel to TC-CUST-014) |

---

## Unresolved Questions

1. **PO decision queue** — 19 items listed in synthesis v2 (Section 5). Until resolved, 🔒 TCs are unverifiable.
2. **Expense CRUD scope** — Edit/Delete (TC-EXP-011/012) added; confirm with PO if in v1 scope (Q19).
3. **Customer detail staff restriction** — US-CUST-004/006 imply Owner/Manager; TC side allows Staff. Which is correct?
4. **Supplier order actor history** — TC-SUPP-ORD-015 should be added once actor tracking confirmed implemented.
