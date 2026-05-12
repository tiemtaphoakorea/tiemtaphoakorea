# Module: Dashboard — Trang chủ admin (`/`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/_content.tsx` (~300 lines)
> Existing TC: TC-DASH-001..012 (mixed status).
> Widgets: KPI cards, BarChartMini (revenue/orders 7d), top products table, recent orders list, low stock alerts.

## Screen Inventory

| Section | Widget |
|---------|--------|
| Header KPIs | Doanh thu hôm nay / Đơn chờ xử lý / Sản phẩm sắp hết / Khách hàng mới (4 cards). |
| Charts | Doanh thu 7 ngày (BarChartMini) + Đơn hàng 7 ngày. |
| Tables | Sản phẩm bán chạy (top N) + Đơn hàng gần đây (5 latest). |
| Alerts | Low stock / out of stock banners. |

---

## (I) Interaction Test Cases

### US-DASH-I001 — KPI cards loading skeleton

**Acceptance Criteria** (TC-DASH-007):
- AC1 (Skeleton on load**): Each card shows Skeleton placeholder.
- AC2 (Replace với data**): When query resolves.
- AC3 (Per-widget loading independent**): Mỗi card có riêng query → load độc lập.

### US-DASH-I002 — Trend delta badge (TC-DASH-002, missing TC-DASH-012)

**Acceptance Criteria**:
- AC1 (Compute % delta**): pctDelta(current, previous).
- AC2 (Color**): positive=green, negative=red, zero=gray.
- AC3 (Sign prefix**): "+17%" or "-5%".
- AC4 (Null guard**): previous=0 → display "—" or "N/A".

### US-DASH-I003 — Chart hover tooltip

**Acceptance Criteria**:
- AC1 (BarChartMini hover**): Tooltip showing date + value.
- AC2 (Keyboard accessible**): Tab through bars.
- AC3 (Empty data**): Empty chart with placeholder.

### US-DASH-I004 — Recent orders row click to detail

**Acceptance Criteria**: Click row → `/orders/{id}`.

### US-DASH-I005 — Date range filter (TC-DASH-010)

**Acceptance Criteria**:
- AC1 (Filter affect KPIs + charts**): All widgets re-fetch with new range.
- AC2 (Default range**): Today / Last 7 days?
- AC3 (Custom range picker**).

### US-DASH-I006 — Top products & top customers widgets (TC-DASH-004, 008)

**Acceptance Criteria**:
- AC1 (Top N products**): Sort by sales DESC.
- AC2 (Link to all**): "Xem tất cả" → `/products` or `/customers`.
- AC3 (Empty state**): TC-DASH-011.

---

## (B) Business Test Cases

### US-DASH-B001 — KPI calculation accuracy (TC-DASH-002, TC-DASH-012 missing)

**Acceptance Criteria**:
- AC1 (Revenue today**): SUM(orders.total) WHERE DATE(createdAt)=today AND status!='cancelled'.
- AC2 (Pending orders**): COUNT orders fulfillmentStatus='pending'.
- AC3 (Low stock count**): COUNT variants available<threshold.
- AC4 (New customers today**): COUNT profiles DATE(createdAt)=today AND role='customer'.
- AC5 (Cross-verify UI vs API exact match**).

### US-DASH-B002 — Order status widget counts (TC-DASH-003)

**Acceptance Criteria**: COUNT(orders) GROUP BY fulfillmentStatus.

### US-DASH-B003 — Top products by sales (TC-DASH-004)

**Acceptance Criteria**:
- AC1 (Aggregation**): SUM(order_items.quantity) per product trong range.
- AC2 (Exclude cancelled**).
- AC3 (Top N**): Default 5.

### US-DASH-B004 — Unread chat count (TC-DASH-009)

**Acceptance Criteria**: COUNT chat_messages WHERE read_at IS NULL AND sender_type='customer'.

### US-DASH-B005 — Empty state (TC-DASH-011)

**Acceptance Criteria**: No orders in range → KPI shows 0, charts empty, tables show "Chưa có dữ liệu".

---

## Linked TC-IDs

TC-DASH-001..012 (existing). US-DASH-I*/B* extends, focuses on exact-delta verification (TC-DASH-012 missing).

## Notes

- Date range UX: verify if calendar picker is accessible.
- Refresh frequency: KPIs cache 30s? Real-time would be ideal for owner monitoring.
- Per-role dashboard: Owner vs Manager vs Staff see different widgets? Verify.
- Mobile responsive: Verify chart legibility on small viewports.
