# US ↔ TC Consistency Review

**Reviewer:** reviewer-2
**Date:** 2026-04-30
**Scope:** `docs/admin-user-stories.md` (28 US) ↔ `docs/admin-test-cases.md` (206 TC)

---

## Findings

### CRITICAL — Missing TC Coverage for US ACs

- [CRITICAL] US-AUTH-003 AC "Manager không thấy Users, Expenses, Settings" — Partially covered (TC-AUTH-009 sidebar only). No URL-direct-access TC for Manager → /users (TC-USERS-009 covers it ✓), Manager → /expenses (TC-EXP-009 covers it ✓), Manager → /settings (TC-SETTINGS-012 covers it ✓). **Resolved on second pass — covered.**
- [CRITICAL] US-DASH-003 AC "Tính toán lợi nhuận tự động" — TC-ANALYTICS-003/004 mention "profit displayed" but no TC explicitly verifies profit = revenue - expenses calculation. Recommendation: add TC-ANALYTICS-009 "Profit auto-calculation correctness".
- [CRITICAL] US-PROD-005 AC "Bảng: Ngày, Giá cũ, Giá mới, Người thay đổi" — TC-PROD-017 covers history but uses "Old Cost / New Cost" (cost), not "Giá cũ / Giá mới" (price). AC mismatch with TC. Recommendation: clarify whether history is for cost or price; TC-PROD-021 covers "Người thay đổi" but only on price edit (TC-PROD-011 records variant history on price change). Mismatch between US and TC fields.
- [CRITICAL] US-CUST-004 AC "Nút reset credentials (password)" — TC-CUST-016 covers reset credentials but does not verify generated/sent flow with new credentials end-to-end (parallel to TC-USERS-004 force-change-on-login TC-USERS-010). No equivalent "force change on next login" TC for customer reset. Recommendation: add TC-CUST-022 if customer credential reset has same flow.
- [CRITICAL] US-CUST-006 AC "đủ điều kiện nâng hạng" (eligibility for tier upgrade displayed on detail page) — No TC covers tier upgrade eligibility display on customer detail page. TC-CUST-015 only verifies badge display in list. Recommendation: add TC-CUST-023 "Customer detail shows tier eligibility/next tier threshold".
- [CRITICAL] US-SUPP-001 AC "Hiển thị thống kê NCC (số đơn, tổng chi phí)" on list page — TC-SUPP-005 covers stats on detail page only, not list. Recommendation: add TC-SUPP-011 "Suppliers list shows order count + total cost per supplier".
- [CRITICAL] US-SUPP-ORD-003 AC "Ghi nhận lịch sử thay đổi" — TC-SUPP-ORD-010 covers timeline but is P3. No TC verifies actor name recorded on supplier order status change (parallel to TC-ORD-014 for customer orders). Recommendation: add TC-SUPP-ORD-015 with actor verification.
- [CRITICAL] US-DEBT-002 AC "phương thức, ghi chú" on debt payment — TC-DEBT-005 covers "Enter amount" only; doesn't verify method + note saved. TC-ORD-012 covers it for order payments. Recommendation: extend TC-DEBT-005 expected result to include method + note saved.
- [CRITICAL] US-EXP-001 AC categories "Tiền thuê, Lương, Quảng cáo, vận chuyển, khác" — TC-EXP-003 covers dropdown options ✓. But no TC for editing or deleting an expense. US-EXP-001 implies CRUD; only Create covered. Recommendation: add TC-EXP-011 (edit) and TC-EXP-012 (delete).
- [CRITICAL] US-HR-001 AC "Hiển thị trạng thái active/inactive" — TC-USERS-001 mentions status column. No TC for activate/deactivate user action (parallel to TC-CUST-014). Recommendation: add TC-USERS-011 "Activate/Deactivate admin user".
- [CRITICAL] US-CHAT-001 AC "Unread count" — TC-CHAT-001 lists unread count column ✓ but no TC verifies count decrements when room opened or new message marks unread. Recommendation: add TC-CHAT-008 "Unread count updates correctly".

### IMPORTANT — Orphan TCs (No Matching US AC)

- [IMPORTANT] TC-AUTH-007 "Logout clears session — back button" — No explicit US AC. US-AUTH-002 implies it but doesn't explicitly state browser back behavior. Acceptable inference; flag for AC addition.
- [IMPORTANT] TC-AUTH-016 "Owner sidebar shows all 13 modules" — US-AUTH-003 covers Staff/Manager visibility but doesn't explicitly state Owner sees all modules. Recommendation: add AC to US-AUTH-003 "Owner sees all 13 modules".
- [IMPORTANT] TC-DASH-005 "Links to Quản lý kho / Sản phẩm mới" — No US AC mentions these dashboard quick-action buttons. Recommendation: add AC to US-DASH-001.
- [IMPORTANT] TC-DASH-006 "Xem báo cáo đầy đủ link" — No US AC mentions analytics link from dashboard. Recommendation: add AC to US-DASH-001 or US-DASH-002.
- [IMPORTANT] TC-PROD-019 "Staff can add products" — No US AC explicitly grants Staff product-add permission (US-PROD-002 says "Staff/Manager/Owner" — covered). OK.
- [IMPORTANT] TC-PROD-020 "Negative price rejected" — No US AC explicitly states price >0 constraint. Recommendation: add to US-PROD-002 ACs.
- [IMPORTANT] TC-PROD-022 "Add without category" — US-PROD-002 lists "danh mục" as a field but doesn't say required. Ambiguous; recommend AC clarification.
- [IMPORTANT] TC-PROD-024 "Image format validation" — No US AC for accepted image formats. Recommendation: add to US-PROD-002.
- [IMPORTANT] TC-ORD-011 "Auto-calc total" — US-ORD-003 ✓ covers it.
- [IMPORTANT] TC-ORD-017 "Cannot skip status" — US-ORD-004 ✓ covers it ("không bỏ bước").
- [IMPORTANT] TC-ORD-026 "Quantity = 0 rejected" — No US AC for quantity > 0 constraint. Recommendation: add to US-ORD-003.
- [IMPORTANT] TC-SUPP-007 "Duplicate supplier name allowed" — No US AC. Recommendation: add to US-SUPP-002 (parallel to US-PROD-002 duplicate-name AC).
- [IMPORTANT] TC-SUPP-ORD-011/012 "Cancel supplier order rules" — No US AC for cancel constraints in US-SUPP-ORD-003. Recommendation: add cancel rules AC.
- [IMPORTANT] TC-SUPP-ORD-013/014 "Quantity/cost validation" — No US AC for these constraints in US-SUPP-ORD-002. Recommendation: add validation ACs.
- [IMPORTANT] TC-DEBT-006 "Cannot exceed debt amount" — No US AC for overpayment rule. Recommendation: add to US-DEBT-002.
- [IMPORTANT] TC-DEBT-009/010 "Staff/Manager can access /debts" — US-AUTH-003 ✓ lists Debts as visible to all 3 roles.
- [IMPORTANT] TC-EXP-005 "Negative amount rejected" — No US AC. Recommendation: add to US-EXP-001.
- [IMPORTANT] TC-USERS-007 "Weak password (<6 chars)" — No US AC for password policy. Recommendation: add to US-HR-002.
- [IMPORTANT] TC-SETTINGS-007 "Tier update recalculates badges" — No US AC. Recommendation: add to US-SETTINGS-001.
- [IMPORTANT] TC-SETTINGS-013 "Delete tier" — US-SETTINGS-001 ✓ ("xóa tầng") covers it.
- [IMPORTANT] TC-SETTINGS-014/015 "Edit/delete banner" — US-SETTINGS-002 ✓ ("Sửa/Xóa banner").
- [IMPORTANT] TC-CHAT-005 "Send disabled empty/whitespace" — No US AC. Recommendation: add to US-CHAT-002.
- [IMPORTANT] TC-CHAT-007 "Send fails network error" — Covered by US-CROSS-001 (network error toast) ✓ but specific to chat — borderline.
- [IMPORTANT] TC-ERROR-002 "API timeout 30s+" — No US AC for timeout behavior. US-CROSS-001 covers network errors generally; timeout-specific not stated.
- [IMPORTANT] TC-ERROR-005 "Concurrent edit" — Marked TBD/blocked. No US AC. OK to keep blocked.
- [IMPORTANT] TC-ERROR-006 "Empty list state" — No US AC explicitly. Recommendation: add cross-cutting AC to US-CROSS-001 for empty states.
- [IMPORTANT] TC-ERROR-007 "Large data load 10k+" — No US AC for performance. Only US-DASH-001 mentions <2s. Recommendation: add cross-cutting performance AC.
- [IMPORTANT] TC-ERROR-008 "Oversized image 10MB" — No US AC for upload size limit. Recommendation: add to US-PROD-002 / US-SETTINGS-002.

### MODERATE — AC ↔ TC Mismatches

- [MODERATE] US-AUTH-002 AC "Session tự động hết hạn sau 30 phút idle" ↔ TC-AUTH-014 — TC precondition "Configured timeout=30min; user logged in >30min idle" matches ✓. Aligned.
- [MODERATE] US-AUTH-002 AC "Đăng nhập mới thay thế session cũ" ↔ TC-AUTH-015 — TC steps say "1. Clear cookies/storage 2. Login as User2". This does NOT test "fresh login replaces existing session" — clearing cookies first invalidates the test premise. The AC says new login should invalidate old session WITHOUT clearing cookies. Recommendation: rewrite TC-AUTH-015 steps: "1. User1 logged in (don't clear cookies) 2. Login as User2 same browser 3. Verify User1's session token is invalidated server-side". **Mismatch.**
- [MODERATE] US-PROD-002 AC "Cho phép trùng tên sản phẩm" ↔ TC-PROD-018 — Aligned ✓.
- [MODERATE] US-ORD-004 AC "Đơn đã Delivered không thể chỉnh sửa; tất cả fields disabled với banner" ↔ TC-ORD-021 — Aligned ✓ (banner + disabled fields verified).
- [MODERATE] US-SUPP-002 AC "Xóa nhà cung cấp chỉ khi không có đơn nhập hàng" ↔ TC-SUPP-010 — Aligned ✓.
- [MODERATE] US-CROSS-001 AC "Trên viewport ≤768px, sidebar thu gọn" ↔ TC-ERROR-010 — Aligned ✓.
- [MODERATE] US-CROSS-001 AC "Inline error biến mất khi user sửa" ↔ TC-ERROR-011 — Aligned ✓.
- [MODERATE] US-CROSS-001 AC "Dữ liệu form được giữ nguyên sau lỗi 500" ↔ TC-ERROR-012 — Aligned ✓.
- [MODERATE] US-CROSS-001 AC "Optimistic UI rollback" ↔ TC-ERROR-013 — Aligned ✓.
- [MODERATE] US-CROSS-001 AC "Redirect sau RBAC block hiển thị toast" ↔ TC-AUTH-010/011/013 — Aligned ✓ (all show toast "Bạn không có quyền truy cập trang này").
- [MODERATE] US-HR-003 AC "Nhân viên phải đổi mật khẩu khi đăng nhập lần đầu sau reset" ↔ TC-USERS-010 — Aligned ✓.
- [MODERATE] US-CAT-002 AC "Không xóa nếu còn sản phẩm hoặc còn danh mục con" ↔ TC-CAT-005 + TC-CAT-007 — Aligned ✓ (both error toasts covered).
- [MODERATE] US-PROD-004 AC "Không cho phép xóa sản phẩm đang có đơn hàng chưa hoàn thành" ↔ TC-PROD-016 — Aligned ✓ (precondition "Product has orders" matches; expected error toast matches).
- [MODERATE] US-DASH-001 AC "Hiển thị so sánh với ngày hôm qua" ↔ TC-DASH-009 — Aligned ✓.

### Role-Restriction Cross-Checks

- US-EXP-001/002 (Owner only) — TC-EXP-008 (Staff blocked) ✓, TC-EXP-009 (Manager blocked) ✓.
- US-HR-001/002/003 (Owner only) — TC-USERS-006 (Staff blocked) ✓, TC-USERS-009 (Manager blocked) ✓.
- US-SETTINGS-001/002 (Owner only) — TC-SETTINGS-006 (Staff blocked) ✓, TC-SETTINGS-012 (Manager blocked) ✓.
- US-DASH-002/003 (Owner/Manager) — TC-ANALYTICS-006 (Staff blocked) ✓. **No TC verifies Manager CAN access /analytics for sub-tabs (Finance, Inventory, Product Analytics).** TC-AUTH-012 only checks landing page. Recommendation: extend TC-AUTH-012 or add Manager-specific sub-tab access TCs.
- US-CUST-004 (Owner/Manager) — **No TC verifies Staff is BLOCKED from /customers/[id] detail page.** US says only Owner/Manager. Recommendation: add TC-CUST-024 "Staff cannot access customer detail page" (or remove role restriction in US if Staff should see detail).
- US-CUST-006 (Owner/Manager tier visibility) — **No TC verifies Staff blocked from tier badges.** Likely Staff sees badges too in practice; AC may be wrong. Clarify.
- US-DEBT-003 (Owner/Manager) — **No TC verifies Staff blocked from debt detail.** TC-DEBT-009 says Staff CAN access /debts. Inconsistency between US-DEBT-003 (Owner/Manager) and TC-DEBT-009 (Staff allowed). **Mismatch.**

### Additional Gaps

- [IMPORTANT] US-ORD-002 AC "Trạng thái thanh toán" on detail — TC-ORD-009 mentions "payment history" but not current payment status display. Minor.
- [IMPORTANT] US-ORD-006 AC "Khôi phục tồn kho sản phẩm" ↔ TC-ORD-018 — Aligned ✓.
- [IMPORTANT] US-CUST-002 AC "Validate email/điện thoại không trùng" — TC-CUST-008 (email) ✓, TC-CUST-009 (phone) ✓, TC-CUST-020 (edit-to-existing email) ✓. Phone edit-to-existing not covered. Minor.
- [IMPORTANT] US-CHAT-002 AC "Hiển thị tin nhắn sent/received" — TC-CHAT-004 covers send. No TC explicitly verifies received-message rendering distinct from sent.

---

## Summary Table

| Metric | Count |
|---|---|
| Total US | 28 |
| Total US ACs (approx.) | ~120 |
| Total TCs | 206 |
| TCs without clear AC mapping (orphans) | 27 |
| ACs without TC coverage (gaps) | 11 critical |
| AC ↔ TC mismatches | 2 (TC-AUTH-015 steps wrong; US-DEBT-003 vs TC-DEBT-009 role conflict) |
| Role restriction TC gaps | 3 (Manager analytics sub-tabs; Staff customer detail; Staff debt detail) |

---

## Top Recommendations (Priority Order)

1. **Fix TC-AUTH-015 steps** — current steps clear cookies first, defeating the test. Rewrite to test session invalidation without clearing.
2. **Resolve US-DEBT-003 vs TC-DEBT-009 role conflict** — US says Owner/Manager only; TC says Staff has access. Pick one.
3. Add critical missing TCs: profit calc, supplier list stats, supplier order actor history, debt payment method+note, expense edit/delete, user activate/deactivate, chat unread count, customer tier eligibility.
4. Add ACs to fill orphan TCs: password policy, image upload format/size, quantity/cost validation rules, dashboard quick-actions, owner-sees-all-modules.
5. Clarify US-PROD-005 cost vs price history scope.

---

## Unresolved Questions

1. US-PROD-005: Should variant history track cost changes, price changes, or both? AC says "cost, price changes" but TC-PROD-017 only verifies cost.
2. US-DEBT-003: Should Staff have access to debt detail pages? US says Owner/Manager; TC-DEBT-009 grants Staff. Source of truth?
3. US-CUST-004: Should Staff access customer detail pages? US restricts to Owner/Manager.
4. US-CUST-006: Tier badge visibility — Owner/Manager only per US, or all 3 roles in practice?
5. TC-ERROR-005 "Concurrent edit" — strategy still TBD per PO. Blocking.
6. Customer credential reset (US-CUST-004): does it follow same force-change-on-login flow as US-HR-003?
7. Are dashboard quick-action buttons ("Quản lý kho", "Sản phẩm mới", "Xem báo cáo đầy đủ") part of US-DASH-001 ACs or separate?

---

**Status:** DONE
**Summary:** Reviewed 28 US (~120 ACs) against 206 TCs. Found 11 critical AC coverage gaps, 27 orphan TCs needing AC backing, and 2 hard mismatches (TC-AUTH-015 wrong steps, US-DEBT-003 vs TC-DEBT-009 role conflict). Most newly added content (US-AUTH-002 timeout, US-PROD-002 dup name, US-ORD-004 immutable delivered, US-SUPP-002 delete constraint, US-CROSS-001) has TC coverage. Main gaps are in role-restriction enforcement and dashboard/analytics secondary features.
**Concerns/Blockers:** 7 unresolved questions require PO/spec author decision before TCs can be finalized.
