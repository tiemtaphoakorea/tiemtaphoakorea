# Module: Inventory — Quản lý kho (`/inventory`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/inventory/_content.tsx`
> Source service: `packages/database/src/services/inventory.server.ts`
> Schemas: `productVariants` (onHand), `inventoryMovements`, `products`
> Movement types: `stock_out | supplier_receipt | manual_adjustment | cancellation | stock_count_balance | cost_adjustment`

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| List | `/inventory` | 4 tabs: Tồn kho / Còn hàng / Sắp hết / Hết hàng. Alert banner (red) khi có lowStock hoặc outOfStock. MetricStatBar 4 KPI: Tổng SKU / Còn hàng / Sắp hết / Hết hàng. Read-only — không có edit/adjust trên page này. |

**Tab behaviors**:
- `stock`: query products page=1 limit=50, no stockStatus filter, allow search + category filter.
- `in`: query products with `stockStatus='in_stock'`.
- `low`: hiển thị `stockQuery.lowStock` (top 10), KHÔNG có search/category, footer link `/analytics/inventory`.
- `out`: hiển thị `stockQuery.outOfStock`, tương tự low.

**Columns (stock/in tab)**: Sản phẩm / Ngày khởi tạo / Có thể bán / Đang giữ (reserved) / Tồn kho / Giá nhập.
**Columns (low/out tab)**: Sản phẩm/SKU / Có thể bán / Tồn kho / Tình trạng.

**Stock color coding** (in stock/in tabs):
- `totalAvailable === 0` → red, bold
- `totalAvailable < minLowStockThreshold (default 30)` → amber, bold
- otherwise foreground, bold

**No write actions on this page**: adjust/opening stock typically lives on Product detail or via dedicated dialog elsewhere. **Verify** if there's `/inventory/adjustments` route (none found in folder list).

---

## (I) Interaction Test Cases

### US-INV-I001 — Alert banner xuất hiện khi có stock issue

**Acceptance Criteria** (`_content.tsx:92-105`):
- AC1 (Both lowStock + outOfStock): Banner shows "{N} SP sắp hết · {M} SP đã hết hàng".
- AC2 (Only lowStock): "{N} SP sắp hết" (no outOfStock segment).
- AC3 (Only outOfStock): Banner KHÔNG render vì condition `lowStock.length > 0 || outOfStock.length > 0` mà conditional segment "· {M}" chỉ append nếu `outOfStock.length > 0`. **Wait — re-read**: outer condition is OR. Nếu chỉ outOfStock có 5, banner sẽ chạy với "0 SP sắp hết · 5 SP đã hết hàng" — verify visually.
- AC4 (Both zero): Banner KHÔNG render.
- AC5 (Color): variant=destructive (red bg + icon).
- AC6 (Icon): AlertTriangle visible.

### US-INV-I002 — MetricStatBar 4 KPIs sync với stockQuery

**Acceptance Criteria**:
- AC1 (Tổng SKU): `totalStatsQuery.metadata.total` từ getProducts({limit:1}) → tổng variants/products toàn DB.
- AC2 (Còn hàng): `Math.max(0, totalSkus - lowStock - outOfStock)` — đếm còn lại.
- AC3 (Sắp hết): `lowStock.length`.
- AC4 (Hết hàng): `outOfStock.length`.
- AC5 (Loading): When `totalStatsQuery` chưa có data → value "—".
- AC6 (Negative guard): `Math.max(0, ...)` cho "Còn hàng" prevent âm khi lowStock+outOfStock > totalSkus (stale data scenario).
- AC7 (Color icons): primary / emerald / amber / red theo từng card.

### US-INV-I003 — Tab change resets query + categoryId

**Acceptance Criteria** (`_content.tsx:142-147`):
- AC1 (Switch tab): User gõ "Kính" + chọn category=X / Click tab "Sắp hết" / Then `setQuery("")` + `setCategoryId("")` → search/category controls về default.
- AC2 (Hide controls on low/out): Khi tab=`low` hoặc `out`, search box + category select không render (`tab === 'stock' || tab === 'in'`).
- AC3 (Switch back): Trở về `stock` tab → search/category lại hiện, query rỗng (đã reset).

### US-INV-I004 — Search + category filter (chỉ tab stock/in)

**Acceptance Criteria**:
- AC1 (Search debounce 300ms): Gõ → 1 request sau ngừng.
- AC2 (Match SKU or name): Search "OTELLO" → products có name hoặc SKU chứa "OTELLO".
- AC3 (Category filter): chọn category X → filter `categoryId=X`.
- AC4 (Combined): search + category đồng thời.
- AC5 (Tab `in` adds stockStatus): tab=in → query có `stockStatus='in_stock'` thêm vào.
- AC6 (Page 1 fixed): Inventory query không có pagination control (page=1, limit=50 cứng).

### US-INV-I005 — Reserved (Đang giữ) cell amber khi > 0

**Acceptance Criteria**:
- AC1 (Has reserve): `p.totalReserved > 0` → cell `<span class="font-semibold text-amber-700">N</span>`.
- AC2 (No reserve): `=0` → cell `<span class="text-muted-foreground">0</span>` (dim).

### US-INV-I006 — Tab low/out footer hint link sang Báo cáo Tồn kho

**Acceptance Criteria**:
- AC1 (Banner text): "Hiển thị 10 SKU cần xử lý nhất · Số liệu đầy đủ theo variant tại Báo cáo Tồn kho".
- AC2 (Link target): `<a href="/analytics/inventory">` underline-offset.
- AC3 (Click navigate): Sang `/analytics/inventory` route.
- AC4 (Top-N display): Backend `getStockAlerts` cap ở 10 SKU per array. UI không cho expand — phải click link.

### US-INV-I007 — Product name truncation 40 chars

**Acceptance Criteria**:
- AC1 (Short name): name <=40 chars → hiện full.
- AC2 (Long name): name > 40 → display `{name.slice(0,40)}…`.
- AC3 (Tooltip?): Không có tooltip — full name không accessible nếu chỉ xem list. **UX gap**.

### US-INV-I008 — ProductThumb với tone từ id

**Acceptance Criteria**:
- AC1 (With image): `p.thumbnail` truthy → ProductThumb dùng src ảnh.
- AC2 (No image): thumbnail null → fallback to color tone theo id + label = thumbLabelFromName(name) (chữ cái đầu).
- AC3 (Variant tab low/out): ProductThumb chỉ có label+tone (không có src — vì là variant level, dùng `v.id`).
- AC4 (Tone deterministic): cùng `id` → cùng tone (theo `thumbToneFromId` hash).

### US-INV-I009 — Empty state phân biệt theo tab

**Acceptance Criteria**:
- AC1 (Tab stock/in no result): "Không tìm thấy sản phẩm".
- AC2 (Tab low empty): "Không có SP sắp hết".
- AC3 (Tab out empty): "Không có SP hết hàng".
- AC4 (Loading): 5 skeleton rows.
- AC5 (Error): TableErrorRow với error message.

### US-INV-I010 — Cost price column "—" khi=0

**Acceptance Criteria**:
- AC1 (Has cost): cost > 0 → format VND.
- AC2 (Zero cost): cost === 0 → "—" muted (chưa có giá nhập từ supplier).
- AC3 (Negative cost): impossible (DB constraint), but if exists → still formatted as VND.

---

## (B) Business Test Cases

### US-INV-B001 — Stock movement insert immutable audit row

**Acceptance Criteria** (`inventory.server.ts:17-47`):
- AC1 (Insert row): `insertInventoryMovement({...})` → 1 row `inventory_movements` với `onHandAfter = onHandBefore + quantity`.
- AC2 (Type enum): type ∈ {stock_out, supplier_receipt, manual_adjustment, cancellation, stock_count_balance, cost_adjustment}. Invalid → DB constraint error.
- AC3 (referenceId optional): null OK; nếu có → trace to source (order, receipt, adjustment).
- AC4 (createdBy optional): null OK cho system actions.
- AC5 (Atomic in tx): Insert phải nằm trong tx của caller — không có standalone API.

### US-INV-B002 — adjustInventory locks variant FOR UPDATE

**Acceptance Criteria** (`adjustInventory`):
- AC1 (Concurrent safety): 2 admin cùng `adjustInventory(variantId=X, quantity=5)` → execute sequentially (FOR UPDATE row lock), kết quả onHand += 10.
- AC2 (Variant not found): variantId không tồn tại → throw "Variant not found".
- AC3 (Negative quantity allowed): qty=-3 → onHand -=3, movement.quantity=-3 (manual reduce).
- AC4 (Negative onHand result): onHand=2, qty=-5 → result onHand=-3. **Quirk**: Service không clamp ≥0. Cần check business rule có muốn allow.
- AC5 (Movement record): quantity, onHandBefore, onHandAfter, type='manual_adjustment', note (optional), createdBy=userId.

### US-INV-B003 — updateOpeningStock UPSERTs + re-chains all movements

**Acceptance Criteria** (`inventory.server.ts:83-187`):
- AC1 (Validation): `newQuantity` phải là non-negative integer; else throw.
- AC2 (UPSERT opening): Existing opening movement → UPDATE quantity + onHandAfter; else INSERT new với createdAt=`OPENING_STOCK_DATE` (2026-04-18T23:59:59Z).
- AC3 (Noop optimization): existing.quantity === newQuantity → return `{noop:true}`, không touch DB beyond initial select.
- AC4 (Re-chain via window): UPDATE inventory_movements: `on_hand_after = SUM(quantity) OVER (ORDER BY created_at, id)`, `on_hand_before = new_after - quantity`. Đảm bảo invariant chain.
- AC5 (Sync product_variants.on_hand): Latest movement's onHandAfter → variant.onHand.
- AC6 (Idempotency): Re-run với cùng newQuantity → returns noop, không tạo movement mới.
- AC7 (Atomic tx): All 3 steps trong cùng transaction; failure rollback.
- AC8 (Opening note literal): Movement created với note='Opening stock — historical balance', type='manual_adjustment'.

### US-INV-B004 — getOpeningStock returns null hay value

**Acceptance Criteria**:
- AC1 (Has opening): Variant có 1 row movement note=OPENING_STOCK_NOTE → return `{ quantity: N }`.
- AC2 (No opening): Variant chưa có → `{ quantity: null }`.
- AC3 (Order): ORDER BY createdAt, id — guarantee first match.
- AC4 (Multiple opening?): Should not exist (UPSERT enforces 1). Nếu race condition tạo 2 → return first chronologically.

### US-INV-B005 — Inventory valuation per SKU

**Acceptance Criteria** (`getInventoryValuation`):
- AC1 (stockValue per row): `onHand * costPrice`, decimal(2).
- AC2 (totalValue): SUM across filtered SKUs.
- AC3 (totalQty): SUM onHand.
- AC4 (Filter search + category): WHERE OR(sku ILIKE, product.name ILIKE, variant.name ILIKE) AND categoryId.
- AC5 (Pagination clamp limit 100): limit > 100 → 100. Page <1 → 1.
- AC6 (Order DESC by onHand): Variants có on_hand cao hiển thị trước.

### US-INV-B006 — Inventory flow report (X-N-T) opening + in - out = closing

**Acceptance Criteria** (`getInventoryFlowReport`):
- AC1 (Opening from latest pre-period movement): `begin_stock` CTE: DISTINCT ON (variant_id) `on_hand_after` từ movement với `created_at < startDate`. → Opening = state cuối kỳ trước.
- AC2 (qty_in sum positive): SUM positive quantities trong period.
- AC3 (qty_out sum abs negative): SUM |negative quantities|.
- AC4 (closingStock formula): opening + in - out (computed, not from current onHand).
- AC5 (Filter row): Chỉ row có activity hoặc opening > 0 hoặc onHand > 0.
- AC6 (Sort): Activity desc (qty_in + qty_out), sku ASC.
- AC7 (Aggregate footer): `totalIn`, `totalOut` across all matching variants (report-wide, not page-scoped).
- AC8 (No opening): variant với pre-period activity = 0 → opening=0.

### US-INV-B007 — getInventoryMovements filter + paginate

**Acceptance Criteria**:
- AC1 (Filter variantId): chỉ movements của 1 variant.
- AC2 (Filter type): chỉ supplier_receipt | stock_out etc.
- AC3 (Date range): startDate <= createdAt <= endDate (gte/lte).
- AC4 (Search SKU): ILIKE on variants.sku via join.
- AC5 (Sort desc createdAt): Newest first.
- AC6 (Pagination defaults page=1 limit=20).

### US-INV-B008 — Daily summary group by DATE(createdAt)

**Acceptance Criteria** (`getInventoryDailySummary`):
- AC1 (Group by date): 1 row per day có activity.
- AC2 (totalIn / totalOut): SUM CASE WHEN qty>0 vs |qty<0|.
- AC3 (Sort): DATE DESC.
- AC4 (Timezone): `DATE()` dùng server timezone — verify nếu cần explicit TZ.

### US-INV-B009 — RBAC: opening/adjust chỉ Owner+Manager

**Acceptance Criteria**:
- AC1 (Staff view inventory): Read-only OK.
- AC2 (Staff adjustInventory API): 403.
- AC3 (Staff updateOpeningStock API): 403.
- AC4 (Manager/Owner): Full.

### US-INV-B010 — onHandBefore/onHandAfter consistency invariant

**Acceptance Criteria**:
- AC1 (Chain integrity): For each variant, ordered movements: `m[i].onHandAfter = m[i+1].onHandBefore` for all i.
- AC2 (Latest matches productVariants.onHand): After any operation, `productVariants.onHand = SELECT onHandAfter FROM inventoryMovements ORDER BY createdAt DESC, id DESC LIMIT 1 WHERE variantId=X`.
- AC3 (Verification test): SQL audit query failing assertion → bug.
- AC4 (Drift after manual SQL): Direct UPDATE on `productVariants.onHand` bypass chain → invariant broken. Recovery: `updateOpeningStock()` re-chains.

### US-INV-B011 — Negative stock guards (or lack thereof)

**Acceptance Criteria**:
- AC1 (Sell beyond stock): Order creation cho variant với onHand=2, qty=5 → cần block (verify order service).
- AC2 (adjustInventory negative result): Allowed currently (xem B002 AC4). Có thể là bug.
- AC3 (Receipt cancel could push negative): `cancelGoodsReceipt` decrements onHand — nếu intervening sales đã rút onHand, cancel → âm. Verify guard or accept.
- AC4 (Report visibility): Variants với onHand<0 hiển thị thế nào trên inventory list? — Hiện không filter, sẽ count vào "out" (available=0?). Verify formula `available = onHand - reserved`.

### US-INV-B012 — Stock alerts API top-10 cap

**Acceptance Criteria** (assumption — verify `getStockAlerts`):
- AC1 (Limit): API trả về max 10 lowStock + 10 outOfStock.
- AC2 (Sort): Sort theo severity (most negative available first).
- AC3 (Threshold): Low = `available < minLowStockThreshold` (default 30 per product, hoặc variant override).
- AC4 (Out): `available === 0`.
- AC5 (Variant-level): Returns variants (`v.id, v.name, v.sku, productName`) — không gộp về product.

---

## Linked TC-IDs (existing docs)

- Có TC-PROD-010 (Inventory Stock Type) và TC-PROD-018 (Low Stock Threshold Update) chạm phần inventory:
  - TC-PROD-010 ≈ US-INV-I005 + B001
  - TC-PROD-018 ≈ US-INV-B012
- TC-PROD-020 (Concurrent Stock Update vs Order Creation) ≈ US-INV-B002 AC1.
- TC-PROD-021 (Concurrent Stock Updates from Two Admin Sessions) ≈ US-INV-B002 AC1.
- TC-PROD-022 (Prevent Negative Stock on Manual Update) → conflicts with US-INV-B002 AC4 (currently allows).
- TC-INT-015 (Manual Stock Increase Reflects in Catalog Availability) ≈ US-INV-B002 + storefront integration test.

## Notes / Edge cases unresolved

- **No write actions on /inventory page itself**: User phải vào product detail để adjust. **UX gap**: nên có inline adjust dialog trên list.
- **Negative onHand**: `adjustInventory` không clamp ≥0. Cần policy.
- **Opening stock magic date**: `2026-04-18T23:59:59Z` hardcoded. Production deploy outside this date window — opening movements vẫn match? Verify migration backfill logic.
- **`stock_count_balance` movement type**: Mentioned in MovementType enum but no service uses it ở file này. Có thể module stocktake (chưa thấy route) — đề xuất tạo `/stocktake`.
- **`cost_adjustment` movement**: Chưa thấy service create — chỉ enum. Khi nào dùng?
- **Daily summary timezone**: `DATE(createdAt)` SQL — depends on `timezone` GUC. Asia/Seoul + UTC stamp có thể lệch 1 ngày boundary.
- **Banner condition with only outOfStock**: Re-verify rendering trong UI thật — branding "0 SP sắp hết · 5 SP đã hết hàng" có ổn không?
- **40-char truncate name no tooltip**: Add tooltip với full name.
