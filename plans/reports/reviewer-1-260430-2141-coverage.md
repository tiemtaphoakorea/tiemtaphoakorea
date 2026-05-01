---
reviewer: reviewer-1
focus: Coverage — US ↔ TC Traceability
date: 2026-04-30
---

# Coverage Review — US ↔ TC Traceability

## Scope
- US file: `/Users/kien.ha/Code/auth_shop_platform/docs/admin-user-stories.md` (28 user stories)
- TC file: `/Users/kien.ha/Code/auth_shop_platform/docs/admin-test-cases.md` (~185 TCs across 15 sections)
- Method: per-AC trace into matching TC(s); flag missing/insufficient/orphan.

## Summary
- **AC checked:** ~95 across 28 US
- **Gaps found:** 22 (5 CRITICAL, 11 IMPORTANT, 6 MODERATE)
- **Orphan TCs:** 4 sections (Error Handling whole section + several individual TCs not mapped to any US)

---

## Findings

### Section 1 — Auth (US-AUTH-001..003)

[MODERATE] Toast on logout success not explicitly verified — Evidence: US-AUTH-002 AC: "Thành công hiển thị toast thông báo" — TC-AUTH-006 verifies redirect + session clear but does NOT assert toast — Recommendation: extend TC-AUTH-006 to assert success toast or add TC-AUTH-006a.

[IMPORTANT] No TC verifies sidebar visibility for Manager regarding Chat/Suppliers/Supplier Orders/Debts — Evidence: US-AUTH-003 AC: "Chat, Products, Orders, Customers, Suppliers, Supplier Orders, Debts hiển thị cho cả 3 vai trò" — TC-AUTH-008..013 only spot-check Users/Expenses/Analytics — Recommendation: add TC asserting full sidebar contents per role (matrix style), especially "all 3 roles see Chat/Suppliers/SupplierOrders/Debts".

### Section 2 — Dashboard (US-DASH-001..003)

[CRITICAL] No TC for "so sánh với ngày hôm qua" — Evidence: US-DASH-001 AC: "Hiển thị so sánh với ngày hôm qua" — TC-DASH-001..008 cover KPI values, recent orders, debt widget, load time, but none asserts the day-over-day comparison delta/indicator — Recommendation: add TC verifying KPI cards display yesterday-vs-today delta (e.g., +/- %).

[IMPORTANT] No TC for Analytics sub-navigation tabs visible — Evidence: US-DASH-002 AC: "Sub-navigation: Overview, Finance, Inventory, Product Analytics" — TC-ANALYTICS-001 partially covers ("Shows: Overview, Finance, Inventory, Product Analytics") — actually OK, TC-ANALYTICS-001 maps. Strike this.

[IMPORTANT] No TC for Analytics filter "ngày/tuần/tháng" — Evidence: US-DASH-002 AC: "Bộ lọc theo ngày/tuần/tháng" — TC-ANALYTICS-003 only checks "date range" generic; no test for the day/week/month preset filter — Recommendation: add TC selecting each preset (day/week/month) and asserting data scope.

### Section 3 — Products (US-PROD-001..005)

[CRITICAL] No TC validates "real-time với debounce" timing — Evidence: US-PROD-001 AC: "Tìm kiếm theo tên (real-time với debounce)" — TC-PROD-002 says "Wait 300ms" but does not test that earlier requests are debounced/cancelled — Recommendation: add TC verifying that fast typing triggers only one API call after debounce window (or accept TC-PROD-002 if debounce assertion added).

[IMPORTANT] No TC for product creation toast confirmation — Evidence: US-PROD-002 AC: "Lưu thành công hiển thị toast" — TC-PROD-007 asserts redirect + "success toast" — actually OK. Strike.

[MODERATE] Edit-success toast not asserted — Evidence: US-PROD-003 AC implicitly via "Lưu thành công cập nhật danh sách" — TC-PROD-010..012 verify list update but not toast — minor; Recommendation: optional add toast assertion.

[MODERATE] Variant detail history columns mismatch — Evidence: US-PROD-005 AC: "Bảng: Ngày, Giá cũ, Giá mới, Người thay đổi" vs TC-PROD-017 expected: "Date, Old Cost, New Cost, Changed By" — TC tests COST history, US says GIÁ (price). Either US/TC must align — Recommendation: clarify price vs cost history; if both, add separate TC for price history.

### Section 4 — Categories (US-CAT-001..002)

[IMPORTANT] No TC for "số sản phẩm trong mỗi danh mục" — Evidence: US-CAT-001 AC: "Hiển thị số sản phẩm trong mỗi danh mục" — TC-CAT-006 covers it. Strike.

[IMPORTANT] No TC for "chuyển danh mục cha" (re-parenting) — Evidence: US-CAT-002 AC: "chuyển danh mục cha" — TC-CAT-003 only changes name; no TC reassigns parent — Recommendation: add TC for reparenting category and assert tree structure update.

### Section 5 — Orders (US-ORD-001..007)

[CRITICAL] No TC for ALL fulfillment status filter values — Evidence: US-ORD-001 AC lists "Pending, Confirmed, Shipped, Delivered" — TC-ORD-007 only tests "Shipped" — Recommendation: parameterize TC-ORD-007 across all 4 statuses or add 3 more TCs.

[IMPORTANT] No TC for fulfillment status history `timestamp + người thực hiện` — Evidence: US-ORD-004 AC: "Mỗi lần thay đổi lưu vào history với timestamp và người thực hiện" — TC-ORD-014 says "history recorded" but does not assert the timestamp + actor are present — Recommendation: extend TC to verify history entry contains timestamp + admin name.

[IMPORTANT] No TC for "ẩn/hiện các button theo trạng thái" — Evidence: US-ORD-004 AC: "Tùy theo trạng thái ẩn/hiện các button (e.g., Shipped button ẩn nếu chưa Confirmed)" — TC-ORD-017 covers via "options disabled" but does not test transition button visibility on the detail page — Recommendation: add TC verifying button visibility per state on order detail page.

[IMPORTANT] No TC for payment method + note recorded — Evidence: US-ORD-005 AC: "Dialog nhập số tiền, phương thức, ghi chú" + "Lưu vào lịch sử thanh toán" — TC-ORD-012/013 only test amount + payment status; no assertion on phương thức + ghi chú stored in payment history — Recommendation: extend TC-ORD-012 to assert all 3 fields persisted.

[MODERATE] No TC for cancel order writes to history — Evidence: US-ORD-006 AC: "Ghi nhận thay đổi trong lịch sử" — TC-ORD-018 only verifies stock restore; TC-ORD-019 only confirms dialog — Recommendation: extend TC-ORD-018 to assert cancellation history entry exists.

[IMPORTANT] No TC for "Biểu đồ theo thời gian" in Order Stats — Evidence: US-ORD-007 AC: "Biểu đồ theo thời gian" — TC-ORD-020 asserts widget shows totals but not the time-series chart — Recommendation: add TC verifying chart rendering with time x-axis.

### Section 6 — Customers (US-CUST-001..006)

[IMPORTANT] No TC for filter by retail customer type — Evidence: US-CUST-001 AC: "Lọc theo loại khách (wholesale, retail)" — TC-CUST-005 covers Wholesale only; no retail filter test — Recommendation: add TC for retail filter (or parameterize).

[IMPORTANT] No TC for "đủ điều kiện nâng hạng" indicator — Evidence: US-CUST-006 AC: "Trang detail khách hiển thị tier và đủ điều kiện nâng hạng" — TC-CUST-015 only checks tier badge in list; TC-CUST-011 mentions sections generically. No TC asserts upgrade-eligibility hint on detail — Recommendation: add TC for tier-progress / next-tier-needed display.

[MODERATE] Reset credentials password generation specifics not tested — Evidence: US-CUST-004 AC: "Nút reset credentials (password)" + TC-CUST-016 says "New credentials generated/sent, dialog shows details" — too vague; not aligned with HR password reset rule (8-char, force change). Recommendation: define and test customer credential reset behavior explicitly.

### Section 7 — Suppliers (US-SUPP-001..002)

[IMPORTANT] No TC for "Hiển thị thống kê NCC (số đơn, tổng chi phí)" on list page — Evidence: US-SUPP-001 AC — TC-SUPP-001 says table shows "order count" only; "tổng chi phí" not asserted on list. TC-SUPP-005 covers detail page stats. Recommendation: add TC asserting list-level supplier stats columns.

[MODERATE] No TC for pagination on suppliers — Evidence: US-SUPP-001 AC: "Phân trang" — no TC-SUPP-* explicitly tests pagination — Recommendation: add TC analogous to TC-CUST-018.

### Section 8 — Supplier Orders (US-SUPP-ORD-001..003)

[IMPORTANT] No TC for Cancelled status filter — Evidence: US-SUPP-ORD-001 AC: "Lọc theo trạng thái (Pending, Confirmed, Delivered, Cancelled)" — TC-SUPP-ORD-002 only tests Pending — Recommendation: extend with TCs for Confirmed, Delivered, Cancelled filters.

[IMPORTANT] No TC for pagination on supplier orders — Evidence: US-SUPP-ORD-001 AC: "Phân trang" — no TC tests it — Recommendation: add TC.

### Section 9 — Debts (US-DEBT-001..003)

[IMPORTANT] No TC for "Lọc theo mức nợ" — Evidence: US-DEBT-001 AC marks (optional) but no TC. — Marked optional in US so MODERATE — Recommendation: optional, add TC if implemented.

[IMPORTANT] No TC for debt detail "timeline thanh toán" — Evidence: US-DEBT-003 AC: "danh sách đơn nợ, timeline thanh toán" — TC-DEBT-008 lists unpaid orders but does not assert payment timeline — Recommendation: extend TC-DEBT-008 to verify payment timeline rendering.

### Section 10 — Expenses (US-EXP-001..002)

[MODERATE] No TC for "Tổng chi phí theo danh mục (widget)" — Evidence: US-EXP-002 AC — TC-EXP-* missing this widget — Recommendation: add TC asserting category-totals widget on expenses page.

### Section 11 — HR / Users (US-HR-001..003)

[IMPORTANT] No TC for "Hiển thị trạng thái active/inactive" — Evidence: US-HR-001 AC — TC-USERS-001 says "table shows ... status" so partially covered. Strike — actually OK.

[CRITICAL] No TC for force-change-on-first-login after HR password reset — Evidence: US-HR-003 AC: "Nhân viên phải đổi mật khẩu khi đăng nhập lần đầu sau reset" — TC-USERS-004 only asserts dialog displays temp password; does NOT test that user is forced to change pw on next login — Recommendation: add TC: reset password → login with temp pw → assert redirect to "change password" flow.

### Section 12 — Settings (US-SETTINGS-001..002)

[CRITICAL] No TC for delete tier — Evidence: US-SETTINGS-001 AC: "Cho phép thêm/sửa/xóa tầng" — TC-SETTINGS-002 (add), TC-SETTINGS-003 (edit) but no delete tier test — Recommendation: add TC for tier deletion; consider edge case (tier in use).

[IMPORTANT] No TC for banner edit/delete — Evidence: US-SETTINGS-002 AC: "Sửa/Xóa banner" — TC-SETTINGS-004 (add), TC-SETTINGS-005 (reorder), TC-SETTINGS-008 (reorder persist) — but no edit/delete TC — Recommendation: add TCs for banner edit + delete flows.

[IMPORTANT] No TC for banner "vị trí" + "trạng thái" fields — Evidence: US-SETTINGS-002 AC: "Upload ảnh, tiêu đề, URL, vị trí, trạng thái" — TC-SETTINGS-004 only mentions image + title + URL — Recommendation: extend TC to set/verify position + status (active/inactive) fields.

### Section 13 — Chat (US-CHAT-001..002)

[MODERATE] No TC for unread count display — Evidence: US-CHAT-001 AC: "Unread count" — TC-CHAT-001 says "unread count" in expected, OK. Strike.

[IMPORTANT] No TC for "tin nhắn sent/received" distinct rendering — Evidence: US-CHAT-002 AC: "Hiển thị tin nhắn sent/received" — TC-CHAT-003/004 generic; not asserting visual distinction sender vs receiver — Recommendation: add TC verifying alignment/styling differentiates sent vs received messages.

---

## Orphan TCs (test exists, no matching AC in US)

[IMPORTANT] TC-AUTH-014 (Session timeout 30min) — no AC in US-AUTH-* mentions session timeout — Recommendation: add AC to US-AUTH-002 or new US-AUTH-004 covering session lifecycle, OR mark TC as derived/non-functional.

[IMPORTANT] TC-AUTH-015 (Multiple login sessions) — no AC covers multi-session behavior — Recommendation: add AC or document as implicit security requirement.

[MODERATE] TC-PROD-018 (Duplicate product name allowed) — Business rule decided in TC summary but not in any US AC — Recommendation: add explicit AC in US-PROD-002 stating uniqueness rule.

[MODERATE] TC-SUPP-007 (Duplicate supplier name allowed) — same as above for US-SUPP-002 — Recommendation: add explicit AC.

[MODERATE] TC-SUPP-010 (Cannot delete supplier with orders) — no US-SUPP AC describes delete behavior at all — Recommendation: add AC to US-SUPP-002 covering deletion + constraint.

[IMPORTANT] TC-SUPP-008 (Delete supplier with no orders) — same; no US AC for supplier deletion — Recommendation: add AC.

[IMPORTANT] TC-ORD-021 (Cannot modify delivered order) — no US-ORD AC mentions immutability after delivery — Recommendation: add AC to US-ORD-004.

[MODERATE] TC-ERROR-001..010 — entire Error Handling section has no corresponding US — Evidence: US file has no US-ERROR-*. — Recommendation: either add a Cross-cutting US ("Error Handling & Resilience") with ACs, or document in non-functional requirements.

[MODERATE] TC-DASH-007 (Load <2s) — covered by US-DASH-001 AC ("Load trong 2 giây"). OK. Strike.

[MODERATE] TC-CHAT-007 (Send message fails - network error) — partial AC under US-CHAT-002, not explicit — Recommendation: add AC for failure handling.

---

## Severity Breakdown
- **CRITICAL: 5** — DASH day-over-day, PROD debounce, ORD fulfillment status filter all values, HR force-change-on-login, SETTINGS delete tier
- **IMPORTANT: 12** — sidebar matrix, analytics presets, category reparent, fulfillment history actor+timestamp, button visibility, payment method+note, order stats chart, customer retail filter, tier upgrade hint, supplier list stats, supplier order Cancelled filter, supplier order pagination, debt timeline, banner edit/delete, banner position+status, chat sent/received styling, orphan auth/order/supplier ACs
- **MODERATE: 6** — logout toast, edit success toast, price-vs-cost history, supplier pagination, debt mức-nợ filter (optional), expense category-totals widget, several orphan TC tags

---

## Unresolved Questions
1. Variant history (US-PROD-005 / TC-PROD-017): does the system record price changes, cost changes, or both? US says price; TC says cost.
2. Customer credential reset (US-CUST-004 / TC-CUST-016): same rule as HR (8-char temp, force change), or different?
3. Should error-handling cross-cutting concerns become a dedicated US section, or stay non-functional?
4. Session timeout duration (TC-AUTH-014 says 30min) — is this a confirmed product decision? Not in any US.
5. Order immutability after Delivered status (TC-ORD-021): confirmed product rule or speculative?
