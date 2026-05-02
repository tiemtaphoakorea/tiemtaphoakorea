---
reviewer: reviewer-4
focus: Error Handling & Edge Cases
date: 2026-04-30
---

# Reviewer-4 — Error Handling & Edge Cases Review

Scope: `docs/admin-test-cases.md` (185 TCs, 15 sections) + `docs/admin-user-stories.md` (US backlog).

Format: `[SEVERITY] finding — Evidence — Current TC — Recommendation`

---

## A. Validation Error Coverage Gaps

### A1. Missing field-level validations

- [IMPORTANT] No TC for product price/cost = 0 hoặc giá < cost — Evidence: Products module có TC-PROD-020 (negative price) nhưng không cover (a) price = 0, (b) selling price < cost (margin âm), (c) stock âm khi edit, (d) cost âm — Current TC: MISSING — Recommendation: thêm TC "Add product với price=0 → reject", "Edit variant: price < cost → cảnh báo hoặc block tùy business rule (cần xác nhận)", "Edit stock = -5 → reject inline".

- [IMPORTANT] Customer email/phone format validation chỉ check 1 phía — Evidence: TC-CUST-007 validate email "abc" reject, TC-CUST-019 validate phone, nhưng KHÔNG có: email với khoảng trắng, email > 255 ký tự, phone có ký tự đặc biệt (+, -, space), phone leading-zero stripping — Current TC: TC-CUST-007/019 (partial) — Recommendation: thêm TC edge-case cho email "user @x.com", phone "+84 901 234 567", phone "0901-234-567".

- [IMPORTANT] User add: thiếu validate fullName, phone, role required — Evidence: TC-USERS-007 (weak password), TC-USERS-008 (empty username) chỉ cover 2 fields. Username format (length min/max, ký tự cho phép, case-sensitivity, dấu space) chưa có — Current TC: MISSING — Recommendation: thêm "Username với khoảng trắng / ký tự đặc biệt / quá dài (>50)", "Empty fullName", "Empty role / role không hợp lệ".

- [IMPORTANT] Category: không có TC cho duplicate name (cùng cấp hoặc khác cấp), circular parent (set parent = chính nó hoặc descendant) — Evidence: TC-CAT-001..008 không cover — Current TC: MISSING — Recommendation: thêm "Add category trùng tên cùng parent → behavior?", "Edit category: set parent thành con của nó → reject 'circular reference'".

- [MODERATE] Supplier: thiếu validate phone, address, supplier email duplicate — Evidence: TC-SUPP-006 chỉ test format email; không có duplicate email/phone check, không có required address (nếu cần) — Current TC: MISSING — Recommendation: thêm TC duplicate supplier email, supplier không có phone (nếu required).

- [MODERATE] Order address: không có TC validate địa chỉ giao hàng (rỗng / dài quá / phone người nhận sai) — Evidence: TC-ORD-010 nói "Set address" nhưng không có error case — Current TC: MISSING — Recommendation: thêm "Tạo đơn không nhập địa chỉ → error", "Phone người nhận sai format".

- [MODERATE] Settings tier: không TC cho discount % > 100 hoặc < 0, duplicate tier name, overlapping min_spend ranges (2 tier cùng ngưỡng) — Evidence: TC-SETTINGS-009/010 chỉ cover name + min_spend>0 — Current TC: MISSING — Recommendation: thêm "Discount = 150% → reject", "2 tier cùng min_spend = 500k → behavior".

- [MODERATE] Banner: thiếu TC cho URL không hợp lệ, image format/size, title quá dài — Evidence: TC-SETTINGS-011 chỉ check missing image — Current TC: MISSING — Recommendation: thêm "Banner URL không phải http(s)", "Upload banner > 5MB", "Title 500 ký tự".

- [MODERATE] Expense: thiếu TC date trong tương lai, amount quá lớn (overflow), description optional/required không rõ — Evidence: TC-EXP-001..010 không cover — Current TC: MISSING — Recommendation: clarify rules trong spec rồi thêm TC.

### A2. Referential integrity gaps

- [CRITICAL] Xóa customer đang có đơn / đang có debt: behavior chưa định nghĩa — Evidence: Customers module (20 TC) hoàn toàn không có TC delete customer; user story US-CUST-005 chỉ nói activate/deactivate, không nói delete. Nhưng nếu UI có delete option (cần verify với spec) thì là CRITICAL gap — Current TC: MISSING — Recommendation: clarify với lead/PO: customer có hard-delete không? Nếu có, thêm TC "Delete customer với active orders → block hoặc soft-delete".

- [IMPORTANT] Xóa user (admin staff) đang được reference trong order history (changedBy, createdBy) — Evidence: TC-USERS-001..009 không có delete user TC. Nếu hỗ trợ delete user, audit log sẽ orphan — Current TC: MISSING — Recommendation: thêm "Delete user đã từng tạo đơn → soft-delete hoặc giữ name snapshot trong history".

- [IMPORTANT] Xóa product có biến thể đã được tham chiếu trong supplier order delivered — Evidence: TC-PROD-016 cover "active orders" nhưng không cover supplier order history — Current TC: PARTIAL (TC-PROD-016) — Recommendation: extend TC-PROD-016 hoặc thêm "Delete product có lịch sử nhập hàng → block".

- [MODERATE] Xóa expense category đang được dùng — Evidence: Expense categories là enum cố định trong TC-EXP-003 nên có thể không applicable; cần confirm — Current TC: N/A — Recommendation: confirm với spec.

---

## B. Error Display Specificity

### B1. Ambiguous expected results — không chỉ rõ WHERE error hiển thị

- [IMPORTANT] TC-AUTH-002/003: "Error message ..." không nói hiển thị ở đâu — Evidence: "Error message 'Tên đăng nhập hoặc mật khẩu không chính xác', stay on login page" — không rõ banner trên form, toast, hay inline dưới password — Current TC: TC-AUTH-002, TC-AUTH-003 — Recommendation: chuẩn hóa "Banner màu đỏ phía trên form login với message X; password field highlight đỏ; username giữ nguyên giá trị".

- [IMPORTANT] TC-AUTH-004/005 "Validation error or disabled button" — quá mơ hồ, OR là 2 behavior khác nhau — Evidence: text rõ ràng "or" — Current TC: TC-AUTH-004, TC-AUTH-005 — Recommendation: chốt 1: hoặc inline error, hoặc button disabled. Document rõ một cách.

- [IMPORTANT] TC-PROD-006 "Error 'Tên sản phẩm bắt buộc'" không nói WHERE — Evidence: chỉ ghi message text — Current TC: TC-PROD-006 — Recommendation: "Inline error dưới field tên; field viền đỏ; focus về field; form không submit; các field khác giữ nguyên" (đồng bộ với TC-PROD-020/022 đã rõ).

- [IMPORTANT] TC-CUST-007/008/017 "Error 'Email không hợp lệ'/'Email đã tồn tại'/'Tên bắt buộc'" — không nói WHERE — Evidence: TC-CUST-007/008/017 — Recommendation: thêm "Inline dưới field email/tên; sheet không đóng; data đã nhập preserved".

- [IMPORTANT] TC-CAT-005/007 "Error 'Danh mục có sản phẩm/danh mục con, không thể xóa'" — không nói toast / dialog / inline — Evidence: TC-CAT-005, TC-CAT-007 — Recommendation: chuẩn hóa "Toast error đỏ + dialog xóa không đóng / không xóa".

- [IMPORTANT] TC-PROD-016 "Error 'Sản phẩm có đơn hàng, không thể xóa'" — Evidence: TC-PROD-016 — Recommendation: chỉ rõ "Toast error; dialog confirm tự đóng; row không bị remove khỏi list".

- [IMPORTANT] TC-DEBT-006 "Error 'Số tiền thanh toán không được vượt quá công nợ hiện tại'" — không nói WHERE — Evidence: TC-DEBT-006 — Recommendation: "Inline dưới input số tiền; dialog không đóng; nút Save disabled cho đến khi sửa".

- [IMPORTANT] TC-USERS-005 "Error 'Username đã tồn tại'" — không nói WHERE và WHEN check (on-blur, on-submit) — Evidence: TC-USERS-005 — Recommendation: "Inline dưới username field; check khi blur (debounce 500ms) hoặc on-submit; sheet không đóng".

- [MODERATE] TC-EXP-004/005 "Error 'Số tiền bắt buộc' / 'Số tiền phải > 0'" — không nói WHERE — Evidence: TC-EXP-004, TC-EXP-005 — Recommendation: "Inline dưới amount field".

- [MODERATE] TC-SUPP-006 "Error 'Email không hợp lệ'" — Evidence: TC-SUPP-006 — Recommendation: "Inline dưới email field".

- [MODERATE] TC-SUPP-ORD-009 "Error 'Phải có ít nhất 1 sản phẩm'" — Evidence: TC-SUPP-ORD-009 — Recommendation: "Toast hoặc banner trên form; nút Save disabled cho đến khi thêm item".

### B2. Generic error messages

- [IMPORTANT] TC-ERROR-004 "Error toast, graceful handling, no crash" — không có message cụ thể — Evidence: TC-ERROR-004 — Current TC: TC-ERROR-004 — Recommendation: define standard message "Đã có lỗi xảy ra, vui lòng thử lại" + correlation ID hiển thị để user báo cho support.

- [IMPORTANT] TC-AUTH-010/011/013, TC-EXP-008, TC-USERS-006, TC-SETTINGS-006, TC-ANALYTICS-006 đều "Redirect to dashboard + error toast" nhưng không nói toast NÓI gì — Evidence: 7+ TC dùng cùng pattern — Current TC: nhiều — Recommendation: chốt 1 message "Bạn không có quyền truy cập trang này" và replace tất cả "+ error toast" bằng cụ thể.

- [MODERATE] TC-ORD-021 "Form locked or error" — quá mơ hồ — Evidence: "Form locked or error" — Current TC: TC-ORD-021 — Recommendation: chốt: form fields disable / status dropdown không show edit options / banner top "Đơn đã giao, không thể chỉnh sửa".

- [MODERATE] TC-ERROR-001 "Error toast 'Mất kết nối', user can retry when online" — Evidence: TC-ERROR-001 — Recommendation: define retry mechanism: auto-retry vs manual button? Optimistic UI rollback?

### B3. WHEN error clears — không có TC nào kiểm tra

- [IMPORTANT] Không TC nào kiểm tra khi user sửa field thì inline error có biến mất không — Evidence: toàn bộ 185 TC — Current TC: MISSING — Recommendation: thêm TC pattern "Sau khi nhận inline error, user sửa field → error tự clear khi blur/onChange".

- [MODERATE] Không TC kiểm tra error toast auto-dismiss timing — Evidence: 185 TC không có — Current TC: MISSING — Recommendation: thêm "Error toast tự đóng sau X giây hoặc cần manual dismiss".

---

## C. State Consistency After Error

### C1. Form data preservation

- [IMPORTANT] Không TC nào kiểm tra form data preserved sau failed submit — Evidence: 185 TC — Current TC: MISSING — Recommendation: thêm TC mẫu cho mỗi form lớn: "Add product: nhập đầy đủ → simulate API error 500 → form giữ nguyên data, không reset, user có thể retry".

- [IMPORTANT] Không TC nào cho session expired during form submit (TC-ERROR-003 có nhưng không kiểm tra data preservation) — Evidence: TC-ERROR-003 chỉ check redirect, không nói data có save draft hay mất hoàn toàn — Current TC: TC-ERROR-003 (incomplete) — Recommendation: extend "After re-login, form data có restore từ localStorage không?" — clarify business rule.

### C2. List/data state after error

- [IMPORTANT] Không TC nào check list không thay đổi khi delete fail — Evidence: TC-PROD-016, TC-CAT-005, TC-SUPP-010 chỉ check error message, không assert "row vẫn còn trong list, count không giảm" — Current TC: PARTIAL — Recommendation: thêm assertion vào các TC delete-blocked: "Sản phẩm vẫn xuất hiện trong list, total count unchanged, dialog confirm tự đóng".

- [IMPORTANT] Không TC nào check optimistic UI rollback — Evidence: 185 TC — Current TC: MISSING — Recommendation: thêm "Update fulfillment status → API fail → status quay lại giá trị cũ trong UI; toast error hiển thị".

### C3. Loading state after error

- [MODERATE] Không TC nào check loading spinner cleared sau error — Evidence: TC-ERROR-002 mention "Loading spinner persists" cho timeout, nhưng không có TC cho error response cleared spinner — Current TC: TC-ERROR-002 (timeout only) — Recommendation: thêm "Submit form → API error 500 → spinner ẩn, button enable lại để retry".

### C4. Concurrent state

- [IMPORTANT] TC-ERROR-005 "last write wins (or conflict warning)" — OR là ambiguous, business rule chưa chốt — Evidence: TC-ERROR-005 — Current TC: ambiguous — Recommendation: chốt strategy. Nếu last-write-wins → warn user khi reload có thay đổi từ user khác. Nếu optimistic locking → cần version field, error 409.

- [MODERATE] Không TC nào cho 2 admin cùng cancel order / cùng record payment cùng lúc — Evidence: 185 TC — Current TC: MISSING — Recommendation: thêm TC "Admin A record payment 100k, Admin B đồng thời record 200k cho cùng đơn debt 250k → behavior?".

---

## D. Business Rule Edge Cases

### D1. Order edge cases

- [CRITICAL] Order với 1 item duy nhất → xóa item đó → đơn còn 0 items: behavior chưa định nghĩa — Evidence: TC-ORD-024 chỉ check create order với 0 items; không có TC cho EDIT order về 0 items — Current TC: MISSING — Recommendation: clarify spec: cấm xóa item cuối cùng (phải hủy đơn) HOẶC tự động set status Cancelled? Thêm TC tương ứng.

- [CRITICAL] Cancel order đã Delivered: behavior chưa định nghĩa — Evidence: TC-ORD-018 (cancel restores stock), TC-ORD-021 (cannot modify delivered) nhưng cancel đã delivered có cho phép không (return flow)? — Current TC: MISSING/AMBIGUOUS — Recommendation: thêm "Cancel đơn Delivered → block hoặc convert thành Return"; nếu allow, stock có +1 lại không?

- [IMPORTANT] Cancel order đã ghi nhận thanh toán partial — refund flow? — Evidence: TC-ORD-018 chỉ nói restore stock, không đề cập payment đã thu — Current TC: MISSING — Recommendation: "Cancel order với 50% paid → debt = -50% (over-paid) hoặc tạo refund record? Block cancel?".

- [IMPORTANT] Update fulfillment backwards (Shipped → Confirmed)? — Evidence: TC-ORD-017 cấm skip forward, không nói về backward — Current TC: MISSING — Recommendation: thêm "Đơn Shipped → đổi về Confirmed → block / cho phép với reason / chỉ Owner".

- [IMPORTANT] Tạo đơn với inactive customer / inactive product — Evidence: TC-CUST-014 deactivate customer, TC-ORD-010 create order, nhưng không cross — Current TC: MISSING — Recommendation: thêm "Tạo đơn cho khách inactive → cảnh báo / block", "Add inactive product vào đơn → block".

- [IMPORTANT] Tạo đơn quantity > stock — Evidence: TC-ORD-010, TC-ORD-026 không cover — Current TC: MISSING — Recommendation: thêm "Add 100 sản phẩm vào đơn nhưng stock chỉ 5 → block hoặc cảnh báo overstock".

- [MODERATE] Order total = 0 (sau discount lớn) — Evidence: 26 TC orders không cover — Current TC: MISSING — Recommendation: thêm "Đơn với total = 0 → behavior payment status (auto Paid)?".

### D2. Payment edge cases

- [CRITICAL] Payment total = 0 sau nhiều partial payments (rounding) — Evidence: TC-ORD-012/013, TC-DEBT-005..011 không cover — Current TC: MISSING — Recommendation: thêm "Đơn 100k, paid 33,333.33 × 3 lần → still có 0.01 dư → status?". Cần chốt rounding rule.

- [IMPORTANT] Payment với amount âm — Evidence: TC-ORD-025/TC-DEBT-011 chỉ cover = 0 — Current TC: MISSING — Recommendation: thêm "Record payment -50,000 → reject inline".

- [IMPORTANT] Payment method dropdown invalid value (API tampering) — Evidence: TC-ORD-012, US-ORD-005 mention "phương thức" không có validation TC — Current TC: MISSING — Recommendation: thêm TC server-side validation cho payment method enum.

- [MODERATE] Payment date trong tương lai — Evidence: 11 debt + 26 order TC không cover — Current TC: MISSING — Recommendation: clarify rule.

### D3. Customer Tier edge cases

- [IMPORTANT] Khách chi tiêu đúng ngưỡng min_spend (boundary) — Evidence: TC-CUST-015, TC-SETTINGS-007 — TC-SETTINGS-007 dùng ví dụ 500k = Gold rồi đổi 600k thành Silver, nhưng không có boundary test (chính xác 500k thì Gold hay Silver) — Current TC: PARTIAL — Recommendation: thêm "Khách chi đúng 500,000 với Gold min_spend = 500,000 → tier = Gold (≥) hay Silver (<)?". Document inclusive/exclusive.

- [IMPORTANT] Không có tier nào match (khách chi rất ít, chưa đạt Bronze min) — Evidence: TC-CUST-015 — Current TC: MISSING — Recommendation: thêm "Khách chi 0đ hoặc < tier thấp nhất → no badge / 'Chưa xếp hạng'".

- [IMPORTANT] Tier downgrade khi customer total_spent giảm (do refund/cancel) — Evidence: TC-SETTINGS-007 chỉ cover khi đổi tier config — Current TC: MISSING — Recommendation: thêm "Khách Gold (500k spent) → cancel đơn 100k → spent = 400k → tier downgrade Silver?". Clarify rule.

- [MODERATE] Xóa tier đang có khách trong tier đó — Evidence: TC-SETTINGS-002/003 không cover delete tier — Current TC: MISSING — Recommendation: thêm "Delete tier Gold đang có 5 khách → block hoặc auto-rebalance".

### D4. Stock & Supplier Order

- [IMPORTANT] Deliver supplier order 2 lần (idempotency) — Evidence: TC-SUPP-ORD-007/008 không kiểm tra double-deliver — Current TC: MISSING — Recommendation: thêm "Set status Delivered 2 lần liên tục → stock chỉ +1 lần (idempotent) hoặc UI disable nút sau lần 1".

- [IMPORTANT] Cancel supplier order Delivered (rollback stock)? — Evidence: TC-SUPP-ORD-011 chỉ cho cancel khi Pending — Current TC: BLOCKED — Recommendation: confirm rule, document trong TC-SUPP-ORD-012.

- [MODERATE] Stock âm sau khi cancel order với sản phẩm đã bị xóa — Evidence: TC-ORD-018, TC-PROD-016 — Current TC: MISSING — Recommendation: edge case rare nhưng nên cover.

### D5. RBAC edge cases

- [IMPORTANT] User self-demote: Owner đổi role chính mình thành Staff → mất quyền — Evidence: TC-USERS-003 cover set role nhưng không edge case — Current TC: MISSING — Recommendation: thêm "Owner duy nhất tự đổi mình thành Staff → block 'Phải có ít nhất 1 Owner'".

- [IMPORTANT] Owner duy nhất tự deactivate / xóa — Evidence: TC-USERS không có — Current TC: MISSING — Recommendation: thêm "Deactivate Owner cuối cùng → block".

- [MODERATE] Staff có session, Owner đổi role Staff thành Manager → session cũ có quyền cũ hay mới? — Evidence: 185 TC — Current TC: MISSING — Recommendation: thêm "Update role realtime ảnh hưởng active session: force re-login hoặc apply trên next request".

---

## E. Cross-cutting Missing Coverage

- [IMPORTANT] CSRF / XSS injection trên các text fields — Evidence: 185 TC không có security — Current TC: MISSING — Recommendation: thêm section "Security" với "Submit '<script>' vào product name → escape khi render".

- [IMPORTANT] SQL injection patterns trong search box — Evidence: TC-PROD-002, TC-CUST-002, etc — Current TC: MISSING — Recommendation: thêm 1 TC kiểm tra "Search ' OR 1=1 -- → không crash, không leak data".

- [MODERATE] File upload type sniffing (renamed .exe → .jpg) — Evidence: TC-PROD-024 chỉ check extension — Current TC: PARTIAL — Recommendation: extend "Upload file .exe đổi tên thành .jpg → server reject by magic bytes".

- [MODERATE] Pagination khi bị xóa mid-flow (đang ở page 5, items giảm còn 3 trang) — Evidence: TC-PROD-005, TC-ORD-022, TC-CUST-018 — Current TC: MISSING — Recommendation: thêm "Page 5 → delete items đến khi tổng < 5 page → auto redirect last valid page".

- [MODERATE] Browser back button sau form submit — Evidence: 185 TC — Current TC: MISSING — Recommendation: thêm "Tạo product → back → submit lại → không tạo duplicate (idempotency hoặc block)".

---

## Summary

**Areas checked:** 15 (toàn bộ section trong test-cases.md)

**Total gaps found:** ~55 distinct findings

**Breakdown:**
- Missing TC: ~35 (validation gaps + business rule edge cases + state consistency)
- Ambiguous expected result: ~14 (chủ yếu thiếu WHERE error display)
- Missing state check (form preservation, list rollback, loading clear): ~6

**Severity:**
- CRITICAL: 4 (delete customer behavior, cancel delivered order, order về 0 items, payment rounding)
- IMPORTANT: ~30
- MODERATE: ~21

**Top priority fixes (do first):**
1. Standardize error display pattern (WHERE/WHAT/WHEN) trong test case template — apply cho tất cả TC có "Error '...'"
2. Clarify business rules (cancel delivered, customer delete, order to 0 items, tier boundary inclusive/exclusive, payment rounding) — block khỏi spec, sau đó viết TC
3. Thêm form-state-preservation TCs cho tất cả major forms (product, customer, order, user, expense, banner)
4. Thêm RBAC self-action edge cases (last Owner protection)
5. Thêm security smoke tests (XSS/SQLi smoke trên search + text inputs)

---

## Unresolved Questions

1. Customer có hard-delete không, hay chỉ activate/deactivate? (US-CUST-005 chỉ nói activate/deactivate, nhưng cần xác nhận UI thực tế)
2. Cancel đơn Delivered có được phép? Nếu có, flow là return/refund hay simple cancel?
3. Payment rounding strategy: round up, round down, hay banker's rounding khi partial payment?
4. Tier boundary rule: min_spend là inclusive (≥) hay exclusive (>)?
5. Customer total_spent có giảm khi cancel/refund không? Nếu có, tier có downgrade tự động?
6. Concurrent edit strategy: last-write-wins thật sự hay optimistic locking? (TC-ERROR-005 đang ambiguous)
7. Session expired mid-form: có save draft localStorage hay user mất hoàn toàn data?
8. Update user role có ảnh hưởng active session không (force re-login)?
9. Last Owner protection: có rule "phải có ít nhất 1 Owner active" không?
10. Supplier delete có hard-delete khi không có order, hay luôn soft-delete?
