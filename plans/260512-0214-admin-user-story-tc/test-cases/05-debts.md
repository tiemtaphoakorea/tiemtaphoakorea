# Module: Debts — Công nợ (`/debts`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/debts/_content.tsx` + `/debts/[customerId]/`
> Shared component: `@/components/admin/shared/debt-payment-drawer`
> Source service: `packages/database/src/services/debt.server.ts`
> Schemas: `orders`, `payments`, `profiles`
> Constants: `FULFILLMENT_STATUS.STOCK_OUT`, `PAYMENT_STATUS.PAID`

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| List | `/debts` | MetricStatBar: Tổng công nợ / Khách có nợ / Số đơn nợ hiển thị. Tabs theo age bucket. Search by name/phone. Columns: KH / SĐT / Số đơn nợ / Số tiền nợ / Nợ lâu nhất (ngày) / Trạng thái / Thu tiền button. |
| Detail | `/debts/[customerId]` | Detail page cho 1 customer: unpaid orders list, payment history, total debt. (Not walked here — see [customerId]/_content.tsx for full detail.) |
| Drawer | DebtPaymentDrawer | Open khi click "Thu tiền" — collect payment cho 1 customer (apply to oldest unpaid orders). |

**Debt definition** (`debt.server.ts:23-25`):
```sql
fulfillmentStatus = 'stock_out' AND paymentStatus != 'paid'
debt = total - COALESCE(paidAmount, 0)
```

**Status pill from age** (`debtStatusType`):
- `< 7 ngày` → tone='unpaid'
- `7–30 ngày` → tone='pending'
- `≥ 30 ngày` → tone='overdue'

**Age tab → minAgeDays filter**:
- `all` → no filter
- `fresh` → minAgeDays=0 (oldestDebtDate ≤ now)
- `old` → minAgeDays=7 (≤ 7 ngày trước)
- `very_old` → minAgeDays=30

**Important quirk**: `fresh` filter sets minAgeDays=0 → server keeps `oldestDebtDate ≤ NOW` (essentially all). To represent "< 7 ngày" properly, server needs `maxAgeDays=7` opposite. **Possible bug** — verify.

---

## (I) Interaction Test Cases

### US-DEBT-I001 — Age tabs map to minAgeDays correctly

**As** an admin user
**I want to** filter công nợ theo độ tuổi qua tabs
**So that** ưu tiên thu nợ lâu

**Acceptance Criteria**:
- AC1 (Tab "Tất cả"): minAgeDays=undefined → server không apply age filter → tất cả khách có debt.
- AC2 (Tab "< 7 ngày"): minAgeDays=0 → query `oldestDebtDate <= NOW`. **Verify**: Có lọc đúng "trẻ hơn 7 ngày" không hay vô tình lọc all? (potential bug — xem note).
- AC3 (Tab "7-30 ngày"): minAgeDays=7 → `oldestDebtDate <= NOW − 7d`. **Verify**: Cũng cần upper bound 30d.
- AC4 (Tab "> 30 ngày"): minAgeDays=30 → `oldestDebtDate <= NOW − 30d`.
- AC5 (Page reset): Tab change → page=1.

### US-DEBT-I002 — Search by customer name/phone (server-side)

**Acceptance Criteria**:
- AC1 (Match name): query="Nguyễn" / Then `ilike(profiles.fullName, '%Nguyễn%')`.
- AC2 (Match phone): query="0901" / Then `ilike(profiles.phone, '%0901%')`.
- AC3 (OR match): query khớp 1 trong 2 field → row hiện.
- AC4 (Debounce 300ms): Verify single network request sau gõ ngừng.
- AC5 (Search reset page): query change → page=1 (`onChange` set page=1).

### US-DEBT-I003 — MetricStatBar hiển thị summary

**Acceptance Criteria** (`_content.tsx:102-126`):
- AC1 (Loading): summary undefined → mỗi metric value "—".
- AC2 (Total debt): "Tổng công nợ" = `summary.totalDebt` format VND. Icon red.
- AC3 (Customer count): "Khách có nợ" = `summary.customerCount` integer.
- AC4 (Current page count): "Số đơn nợ hiển thị" = `total` từ list query metadata + trend "Trang {page}".
- AC5 (Filter doesn't affect summary): Summary là aggregate toàn DB (qua `getDebtAggregate`) → KHÔNG thay đổi khi tab/search change. List `total` MỚI thay đổi theo filter.

### US-DEBT-I004 — "Thu tiền" button mở DebtPaymentDrawer

**Acceptance Criteria**:
- AC1 (Open drawer): Click → `setPaymentCustomerId(d.customerId)` → drawer mở với customer context.
- AC2 (Drawer close): Drawer trigger onClose → `setPaymentCustomerId(null)` → drawer đóng.
- AC3 (After payment success): Drawer dispatch invalidate `queryKeys.debts.list` + `queryKeys.admin.debtSummary` → list + metric bar refresh.
- AC4 (Multiple opens): Click row A → đóng → click row B → drawer mở với customer B (state replace, không stack).

### US-DEBT-I005 — Status badge color theo age days

**Acceptance Criteria**:
- AC1 (Unpaid <7): `days < 7` → StatusBadge type='unpaid' (neutral/light).
- AC2 (Pending 7-30): 7 ≤ days < 30 → type='pending' (amber).
- AC3 (Overdue ≥30): days ≥ 30 → type='overdue' (red).
- AC4 (Bold overdue text): Trong cột "Nợ lâu nhất", nếu days≥30 → text class `font-bold text-red-600`; otherwise muted.

### US-DEBT-I006 — Debt amount red bold

**Acceptance Criteria**:
- AC1 (Format): `formatVnd(Number(d.debt))` → "1.234.567 ₫" (or similar VND format).
- AC2 (Color/weight): cột "Số tiền nợ" = `text-red-600 font-bold`.
- AC3 (Tabular nums): font-feature-settings để số align.
- AC4 (Zero edge case): Nếu debt=0 (race condition) → hiện "0 ₫" red bold — tuy nhiên server filter `!= paid` đảm bảo debt > 0 thường.

### US-DEBT-I007 — Empty state phân biệt loading vs no data

**Acceptance Criteria**:
- AC1 (Loading): `debtsQuery.isLoading=true` → 5 skeleton rows.
- AC2 (Error): `debtsQuery.error` → 1 row error message.
- AC3 (Empty after load): no error + 0 results → "Chưa có công nợ" centered.
- AC4 (Count badge hidden when 0): khi `total === 0`, không hiện "{n} khách" cạnh search.

---

## (B) Business Test Cases

### US-DEBT-B001 — Debt = STOCK_OUT + NOT_PAID

**Acceptance Criteria**:
- AC1 (Inclusion): Order với `fulfillmentStatus='stock_out'` AND `paymentStatus IN ('unpaid','partial')` → count vào debt.
- AC2 (Exclusion: not shipped): `fulfillmentStatus='in_stock'` (chưa xuất kho) → KHÔNG count, kể cả nếu chưa thanh toán.
- AC3 (Exclusion: paid): `paymentStatus='paid'` → KHÔNG count.
- AC4 (Exclusion: cancelled): Cancelled order → có thể là `fulfillmentStatus='cancelled'`, KHÔNG count.
- AC5 (Debt amount = total - paidAmount): COALESCE handle null paidAmount as 0.

### US-DEBT-B002 — Aggregate per customer (sum unpaidOrders, max age, oldest date)

**Acceptance Criteria** (`debt.server.ts:34-46`):
- AC1 (Group by customerId): customer X có 3 unpaid orders → 1 row, `unpaidOrders=3`.
- AC2 (Debt sum): `SUM(total - paidAmount)` across 3 orders.
- AC3 (Oldest date): `MIN(stockOutAt)` across 3 orders.
- AC4 (Inner join profile): Customer phải exist trong profiles. Orphan customerId (deleted profile) → KHÔNG hiện trong debt list.

### US-DEBT-B003 — Aggregate filter minAgeDays cutoff

**Acceptance Criteria** (`debt.server.ts:62-65`):
- AC1 (minAgeDays=7): Cutoff = NOW - 7d. `oldestDebtDate <= cutoff` → giữ row "nợ ≥ 7 ngày".
- AC2 (Same cutoff applied to count): Count query cũng apply same cutoff (verify cả `rows` và `countRow` match — `debt.server.ts:74-77`).
- AC3 (No upper bound): "7-30 ngày" tab thực ra trả về tất cả "≥ 7 ngày" (chứa cả >30). Có thể tô đúp với "> 30 ngày". **Bug candidate**.
- AC4 (minAgeDays=0): cutoff=NOW → keep oldestDebtDate ≤ NOW (luôn true) → returns all. Tab "< 7 ngày" thực chất KHÔNG lọc gì → KHÔNG đúng intent. **Confirmed bug?**

### US-DEBT-B004 — getDebtAggregate global totals

**Acceptance Criteria** (`debt.server.ts:127-141`):
- AC1 (Total debt): `SUM(total - paidAmount)` toàn bộ unpaid stock_out orders.
- AC2 (Customer count): `COUNT(DISTINCT customerId)`.
- AC3 (No filter scope): Aggregate KHÔNG apply search/age filter từ list query → luôn là global truth.
- AC4 (COALESCE null safety): paidAmount null → 0, total null → 0 (assumed not null in schema).
- AC5 (Empty DB): No matching orders → return `{ totalDebt: 0, customerCount: 0 }`.

### US-DEBT-B005 — getCustomerDebt detail per customer

**Acceptance Criteria** (`debt.server.ts:83-125`):
- AC1 (Customer found): Return `{ customer, totalDebt, unpaidOrders, paymentHistory, allOrders }`.
- AC2 (Customer not found): `getCustomerDebt('invalid-uuid')` → return null (UI 404).
- AC3 (Unpaid filter): unpaidOrders = orders với `stock_out + !paid` (filter ở app level, không DB).
- AC4 (Total computed in app): Sum `total - paidAmount` for each unpaid.
- AC5 (Payment history): All payments across customer's orders, desc by createdAt.
- AC6 (Sort allOrders): allOrders desc by createdAt.

### US-DEBT-B006 — DebtPaymentDrawer apply payment FIFO to oldest orders

**Acceptance Criteria** (assumption — verify in `debt-payment-drawer.tsx`):
- AC1 (Apply oldest first): Customer có 3 unpaid orders (debt 100/200/300, total 600). Pay 250 → order 1 paid (100), order 2 paid 150/200 → status partial.
- AC2 (Update paidAmount per order): Each order's `paidAmount` += allocated portion.
- AC3 (Multiple rows): Single API call distributes amount across orders in oldest-first order.
- AC4 (Update paymentStatus per order): Auto derive paid/partial after allocation.
- AC5 (Atomic transaction): Allocation across N orders trong cùng DB tx.
- AC6 (Over-pay reject): Pay > totalDebt → reject hoặc only allocate up to debt.

### US-DEBT-B007 — RBAC: Thu tiền chỉ Owner+Manager

**Acceptance Criteria**:
- AC1 (Staff view): Staff có thể list debts (read).
- AC2 (Staff thu tiền): Staff click button → drawer mở nhưng submit → 403, hoặc button bị ẩn (depend on implementation).
- AC3 (Manager/Owner): full.

### US-DEBT-B008 — Search ILIKE injection safe

**Acceptance Criteria**:
- AC1 (Wildcard %): query="%" → drizzle parameterized, ilike pattern `%\%%` literal match.
- AC2 (SQL inject): query="' OR 1=1 --" → no 500, drizzle parameterized.
- AC3 (Long input): query 500 chars → safe.

### US-DEBT-B009 — Pagination default + limits

**Acceptance Criteria**:
- AC1 (PAGINATION_DEFAULT): No page/limit → page=1, limit=PAGINATION_DEFAULT.LIMIT.
- AC2 (Max limit): limit > 200? — depends on `calculateMetadata` clamp. Verify.
- AC3 (Page 0/negative): page<1 → clamp 1 (`Math.max(1, ...)`).

### US-DEBT-B010 — Race condition: Pay during view

**Acceptance Criteria**:
- AC1 (Stale list): A đang view list, B thu tiền cho khách X → A's list shows outdated debt cho đến khi refetch (`staleTime: 30s`).
- AC2 (Optimistic concurrency): If A starts payment for X while B has paid → server check (allow partial since debt is computed live; pay amount might overshoot remaining if not validated).
- AC3 (Recommend): API payment endpoint nên re-read current debt trước khi allocate, throw 409 nếu overpay.

### US-DEBT-B011 — STOCK_OUT condition includes only shipped orders

**Acceptance Criteria**:
- AC1 (stockOutAt set): Order chỉ vào debt khi đã `stockOutAt != null` (verify via fulfillmentStatus enum).
- AC2 (Order created not shipped): Order với status='draft'/'pending' KHÔNG hiện trong debt (chưa hứa giao hàng).
- AC3 (Cancelled order with payment): Refund flow — order cancelled + có payment → debt logic không cover. **Note**: Có cần `customer_credit` riêng?

---

## Linked TC-IDs (existing docs)

- Không có TC-DEBT-* riêng trong `docs/035-QA/QA-MOC.md`.
- Test cases ngầm cover bởi:
  - TC-PAY-001..010 (customer payment) → related to US-DEBT-B006.
  - TC-CUST-007 (Customer Order History) → related to US-DEBT-B005.
  - TC-INT-005 (Payment Updates Order Status & Dashboard KPIs) → related to US-DEBT-B004.

## Notes / Edge cases unresolved

- **🐛 Bug candidate `minAgeDays=0` cho tab "< 7 ngày"**: filter `oldestDebtDate <= NOW` luôn true → tab này thực ra hiển thị tất cả. Phải đổi sang `maxAgeDays` semantics hoặc map fresh→null.
- **🐛 Tabs "7-30" và "> 30" overlap**: Cả 2 trả về "≥ N ngày" → tab 7-30 chứa cả >30. Cần upper bound cho tab giữa.
- **Detail page `/debts/[customerId]`**: Chưa walk — cần Phase B follow-up.
- **DebtPaymentDrawer**: Component shared — walk riêng để define I tests (form state, allocation preview, multi-order display).
- **Customer credit / overpay**: Không có flow refund/credit ở model hiện tại.
- **Soft-deleted customer with debt**: Inner join với profiles → orphan debt biến mất khỏi list. Có cần soft-delete protection?
- **Debt sortable?**: List sort cố định ASC by oldestDebtDate. UX có thể thêm sort by amount desc.
- **Per-order detail link**: List không link sang detail order — user phải vào `/debts/[customerId]` rồi click thêm. Verify UX flow.
