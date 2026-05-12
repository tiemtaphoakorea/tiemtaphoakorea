# Scenario Report — Admin User-Story TC Artifact Review (Business-Focused)

> Target: `plans/260512-0214-admin-user-story-tc/`
> Date: 2026-05-12 | Branch: dev (`6fcc621`)
> Skill: `/ck:scenario` — apply 12 dimensions nhưng chỉ giữ business-critical (bỏ a11y/mobile/i18n/dark mode/Unicode extremes/GDPR generic).
> Sample read: plan + GAP + `00-login`, `02-purchases`, `03-receipts`, `05-debts`, `06-inventory`, `07-settings`.

## Coverage matrix (business dimensions only)

| Dimension | Coverage | Tóm tắt |
|-----------|----------|---------|
| State Transitions (PO/Receipt/Payment) | 🟢 Strong | State machine rất chi tiết. Thiếu idempotency-key, mid-refresh recovery, PARTIAL cancel behavior. |
| Data Integrity (stock chain, WAC) | 🟢 Strong | Audit chain + FOR UPDATE covered. Thiếu concurrent `updateOpeningStock`, direct SQL bypass, decimal drift. |
| Authorization (RBAC) | 🟡 Partial | Owner/Manager/Staff matrix per module ✅. Thiếu IDOR/mass-assignment guard, mid-session deactivate, session/cookie tampering. |
| Business Logic (money/debt) | 🟡 Partial | WAC + payment derive + debt aggregate tốt. Thiếu refund/credit memo, discount stacking guard, PARTIAL PO cancel. |
| Timing/Concurrency | 🟡 Partial | FOR UPDATE + debounce OK. Thiếu network-drop retry duplicate, DATE() timezone drift, settings fetch overwrites typing. |
| Error Cascades (TX rollback) | 🟡 Partial | Rollback covered. Thiếu DB pool exhaustion, partial write atomicity on stock chain re-build. |
| Input/Validation (server-side) | 🟢 Strong | Negative qty, ILIKE inject, empty items, max length đều có. |
| Scale | 🟡 Partial | Pagination clamp OK. Thiếu COUNT(DISTINCT) perf trên debts với 10k+ customers, bulk-select 1399 products. |

---

## Critical scenarios chưa cover (business correctness)

| # | Dimension | Scenario | Expected |
|---|-----------|----------|----------|
| 1 | Data Integrity | Concurrent `updateOpeningStock` cho cùng variant — 2 chains re-build song song | FOR UPDATE lock toàn variant trước khi re-chain; một call wait |
| 2 | Data Integrity | Direct SQL UPDATE `productVariants.onHand` bypass movement chain (manual fix in prod) | CI/audit query phát hiện drift: `variants.onHand != latest movement.onHandAfter` |
| 3 | State Transitions | Browser refresh / network drop giữa `completeGoodsReceipt` mutation → client retry | Idempotency-Key header: cùng key không tạo duplicate movement + double WAC update |
| 4 | State Transitions | Concurrent `cancelGoodsReceipt` (2 admin) trên cùng COMPLETED receipt | 1 succeed (stock reversed 1 lần), 1 fail "Đã huỷ" — current code có FOR UPDATE? Verify |
| 5 | Business Logic | Cancel paid order (refund flow missing — đã flag US-DEBT-B011) | Định nghĩa: anonymize payment, tạo credit memo, hay reject cancel? Hiện tạo orphan payment |
| 6 | Authorization | IDOR: `GET/PATCH /api/admin/receipts/{id}` không check ownership (single-tenant nên OK hiện tại, nhưng nếu multi-tenant) | Server validate `receipt.shopId === currentUser.shopId` |
| 7 | Authorization | Mass assignment: PUT user body chứa `role: "owner"` bởi staff | Server whitelist fields, drop `role` nếu không phải Owner change |
| 8 | Authorization | User bị `isActive=false` mid-session bởi Owner khác | Next request → 401, session invalidated (chỉ login B003 test login-time) |
| 9 | Business Logic | Decimal drift trong WAC: nhiều receipts cộng dồn `Number().toFixed(2)` → cents lệch (đã note B002 AC7) | Migrate sang `decimal.js`/`dinero.js` hoặc dùng numeric SQL exclusively |
| 10 | Timing | `getInventoryDailySummary` dùng `DATE(createdAt)` — server UTC vs store Asia/Seoul lệch ngày boundary | `DATE(createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh')` hoặc store date column riêng |

## High scenarios

| # | Dimension | Scenario | Expected |
|---|-----------|----------|----------|
| 11 | Business Logic | PARTIAL PO cancel (US-PURCH-B005 AC3 đã ngỏ) — đã nhận một phần stock, cancel | Define: keep received stock (chỉ block tiếp nhận) hoặc force reverse receipt trước? |
| 12 | Business Logic | Receipt không link PO (standalone manual receipt — US-RECEIPT note đã flag) | TC riêng: stock cộng đúng, không touch PO state, WAC vẫn áp dụng |
| 13 | Business Logic | Discount > total → payable âm (US-RECEIPT-B008 AC6 đã ngỏ) | Server guard: `payableAmount = MAX(0, total - discount + extra)` hoặc reject với 400 |
| 14 | Business Logic | Overpay payout: trả vượt `debtAmount` của receipt (UI block via max, nhưng API direct?) | Server reject 400, không cho `paymentStatus='paid'` với sum > payable |
| 15 | Business Logic | DebtPaymentDrawer FIFO allocation (US-DEBT-B006 toàn assumption) — chưa verify code | Walk component, viết TC: oldest-first, atomic across N orders, over-pay reject |
| 16 | Data Integrity | Receipt cancel sau khi stock đã rút bởi orders (race) → onHand âm | `GREATEST(0, ...)` clamp đã có ở US-RECEIPT-B004 AC4; verify + alert log khi clamp trigger |
| 17 | Data Integrity | `adjustInventory` qty âm đẩy onHand < 0 (D.4 bug, US-INV-B002 AC4) | Pre-check trong service: throw nếu `onHand + quantity < 0` |
| 18 | Authorization | Staff gọi trực tiếp service-level API (bypass UI gate) — verify mọi endpoint có server-side RBAC | Per-endpoint: `assertCanManage(role)` trước action |
| 19 | Timing | Settings GET response overwrites user typing (D.6 confirmed bug) | Dirty flag check; chỉ setState nếu user chưa edit |
| 20 | Audit | Settings/Users/Roles change không log ai/khi/trước-sau | Add `audit_log` table: insert row sau mỗi mutation owner-level |
| 21 | Scale | Debts với 10k+ unpaid orders: `COUNT(DISTINCT customerId)` + aggregate chậm | Composite index `(fulfillmentStatus, paymentStatus, customerId)`; verify EXPLAIN |
| 22 | Error Cascades | `updateOpeningStock` window function fail mid-execute → onHand drift | TX atomicity verify; nếu fail rollback toàn bộ 3 steps (US-INV-B003 AC7) |

## Medium scenarios

| # | Dimension | Scenario | Expected |
|---|-----------|----------|----------|
| 23 | State Transitions | Cancel CANCELLED receipt/PO lần 2 (re-cancel — US-PURCH-B005 AC5 flagged) | Idempotent return, không overwrite `cancelledAt` |
| 24 | Business Logic | Receipt cost = "0" hoặc unitCost variant=null default "0" (US-PURCH note 313) → WAC nhận 0 | Reject hoặc warning trước submit; hoặc cho phép nhưng skip WAC update |
| 25 | Business Logic | Receipt cancel từ COMPLETED qua API (service support, UI ẩn — US-RECEIPT I006 AC3) | Decide: expose UI menu hay block tại service level |
| 26 | Data Integrity | Soft-delete supplier có receipts active → receipts hiển thị supplier name? | Inner join làm receipts ẩn; chuyển sang LEFT JOIN + show "Đã xoá" placeholder |
| 27 | Debts | Tab "< 7 ngày" filter `minAgeDays=0` luôn match all (D.1 confirmed bug) | Map fresh → `maxAgeDays=7`; tab old → `minAge=7, maxAge=30`; very_old → `minAge=30` |
| 28 | Business Logic | Customer tier threshold inversion (loyal < frequent — US-SET-B003) | Server validate `loyalMinOrders >= frequentMinOrders` |
| 29 | Error Cascades | Print invoice fetch shop info miss cache + DB down | Fallback last-cached value, không in trắng |

---

## Cross-cutting must-fix (business-critical only)

### M1. Idempotency cho mutations sửa stock/money
Mọi mutation có side-effect kép (complete receipt, cancel receipt, confirm PO, create payout, delete payout) cần `Idempotency-Key` header. Mid-refresh + retry hiện tại có thể tạo duplicate movements + double WAC update.

### M2. Audit log unified
Hiện chỉ `cost_price_history` ghi lại WAC change. Settings, Users, Roles, tier config, branding đều không có audit. Owner-level changes cần `audit_log` table: `{action, entity, entityId, before, after, userId, createdAt}`.

### M3. Refund / credit memo spec
US-DEBT-B011 AC3 + Open question #8: cancel paid order hiện tạo orphan payment. Block thêm payment-related TC trước khi định nghĩa flow.

### M4. Decimal precision
US-RECEIPT-B002 AC7 note "WAC float drift". Hiện `Number().toFixed(2)` cho money. Volume lớn (1000+ receipts/tháng) sẽ drift cents trong WAC + profit report. Migrate sang `decimal.js` hoặc dùng `numeric` SQL ops thuần.

### M5. Debts age filter bug (D.1/D.2)
Confirmed bug ở GAP-REPORT — fix service signature: `{ minAgeDays?, maxAgeDays? }` + remap UI tabs.

### M6. Negative-stock policy
Hiện 3 chỗ có thể tạo onHand âm: (1) `adjustInventory` qty âm không clamp, (2) receipt cancel sau khi orders đã rút stock, (3) order create vượt stock (verify order service). Define policy: hard-block, soft-warn, hoặc allow + flag để audit.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 10 |
| High | 12 |
| Medium | 7 |
| **Total** | **29 business-focused scenarios** |

**Top 3 must-do trước khi production:**
1. **Refund/credit memo spec** — current cancel-paid-order tạo orphan payment, dữ liệu finance không recover được.
2. **Idempotency-Key** cho stock/money mutations — mid-refresh duplicate là rủi ro hằng ngày.
3. **Debts age filter fix** + **audit_log table** — bug confirmed + governance gap rõ ràng.

## Unresolved questions (business decisions cần chốt)

1. PARTIAL PO cancel: keep received stock hay force reverse receipt trước?
2. Refund flow: anonymize payment / credit memo / reject cancel — pick one.
3. Negative-stock policy: block / warn / allow + flag?
4. Decimal precision lib: `decimal.js`, `dinero.js`, hay numeric SQL only?
5. Soft-delete entity (supplier/customer/product) hiển thị thế nào ở historical records (receipts, orders)?
6. Audit log scope: only owner-level changes, hay tất cả mutations?
7. Cost = 0 receipt: reject, warn, hay allow + skip WAC?
