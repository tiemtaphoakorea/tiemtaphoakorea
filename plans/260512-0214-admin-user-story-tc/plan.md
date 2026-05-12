# Plan: Define User Story Test Cases cho toàn bộ Admin app (apps/admin)

## Context

Test hiện tại trong `tests/e2e/` (Playwright) không cover hết các trường hợp trong code. `docs/035-QA/TEST-STATUS.md` cho thấy đa số TC hiện có ở trạng thái `needs-fix` (false positives, dead code, brittle assertions) hoặc `missing`/`draft`. Đồng thời có 7 module admin mới chưa có TC nào trong QA-MOC: **purchases, receipts, payouts, debts, inventory, content, homepage, settings**.

User muốn: walk-through từng màn admin qua Claude-in-Chrome, define test cases dưới dạng **User Story + Acceptance Criteria (Gherkin)** để làm chuẩn vàng (golden test cases) — sau đó có thể đối chiếu với Playwright specs để xác định gap. Output lưu vào `plans/260512-0214-admin-user-story-tc/test-cases/` (không động vào `docs/035-QA/` để giữ ngăn nắp cho review).

## Goals & Non-goals

**Goals**
- Define user-story-style TC cho 19 admin modules dựa trên UI thật (Claude-in-Chrome) + source code.
- Mỗi module có 2 nhóm TC tách biệt:
  - **(I) Interaction TCs** — hành vi UI/UX thuần: tương tác element, navigation, form state, loading, toast, focus, keyboard, dialog, optimistic update, error UI…
  - **(B) Business TCs** — quy tắc nghiệp vụ domain: status transition, stock/cost (WAC), payment derivation, idempotency, audit trail, RBAC matrix, validation rule, edge data, concurrency.
- Mỗi TC bám sát hành vi quan sát được trên UI + behavior đọc từ server actions / schema.

**Non-goals**
- KHÔNG viết Playwright code mới (chỉ TC dưới dạng `.md`).
- KHÔNG fix các TC hiện có ở `docs/035-QA/` (làm ở task khác).
- KHÔNG cover `apps/main` storefront (đã loại trừ trong scope).

## Pre-requisites (cần xác nhận trước khi exec)

1. **Dev server phải chạy**: `pnpm dev` (Admin: `http://localhost:3001`, Main: `http://localhost:3000`).
   - Hiện tại chưa thấy server lắng nghe ở port 3000 (`lsof :3000` rỗng). Cần `pnpm dev` chạy ở terminal khác.
2. **Test users đã có trong DB** (theo `tests/e2e/fixtures/auth.ts`):
   - `admin` / `password123` (Owner)
   - `manager` / `password123`
   - `staff` / `password123`
   - Có thể cần `pnpm db:seed:e2e` nếu DB trống.
3. **Claude in Chrome extension đã connect**: sẽ verify bằng `tabs_context_mcp` ở bước đầu exec.

## Admin module inventory (19 module)

Từ `apps/admin/app/(dashboard)/`:

| # | Module | Route | Sub-routes | Coverage hiện tại |
|---|--------|-------|-----------|-------------------|
| 1 | dashboard | `/` | widgets (kpi, top-products, low-stock, top-customers, unread-chat, date-range, empty-state) | TC-DASH-001..012 (nhiều needs-fix) |
| 2 | analytics | `/analytics` | overview, products, finance, inventory, debts | TC-ANALYTIC-001..002 (needs-fix) |
| 3 | categories | `/categories` | — | TC-CAT-001..005 (needs-fix) |
| 4 | chat | `/chat` | — | TC-CHAT-001..014 (mostly needs-fix) |
| 5 | content | `/content` | — | **KHÔNG có TC** |
| 6 | customers | `/customers`, `/customers/[id]` | — | TC-CUST-001..012 |
| 7 | debts | `/debts`, `/debts/[customerId]` | — | **KHÔNG có TC** |
| 8 | expenses | `/expenses` | — | TC-EXP-001..005 |
| 9 | homepage | `/homepage` | — | **KHÔNG có TC** |
| 10 | inventory | `/inventory` | — | **KHÔNG có TC riêng** (chỉ TC-PROD-010,018 chạm) |
| 11 | orders | `/orders`, `/orders/[id]`, `/orders/new` | — | TC-ORD-001..028 |
| 12 | payouts | `/payouts` | — | **KHÔNG có TC** |
| 13 | products | `/products`, `/products/[id]`, `/products/new` | — | TC-PROD-001..022 |
| 14 | purchases | `/purchases`, `/purchases/[id]`, `/purchases/new` | — | **KHÔNG có TC** (route mới, slug ngắn) |
| 15 | receipts | `/receipts`, `/receipts/[id]`, `/receipts/new` | + payment dialog | **KHÔNG có TC** |
| 16 | settings | `/settings` | branding panel, color-pair-picker | **KHÔNG có TC** |
| 17 | supplier-orders | `/supplier-orders` | + create-dialog, detail-dialog | TC-SUP-ORDER-001..028 (legacy?) |
| 18 | suppliers | `/suppliers` | — | TC-SUP-001..005 |
| 19 | users | `/users` | — | TC-USER-001..005 |
| 20 | widgets | `/widgets` (component test page?) | — | — |
| — | login | `/login` (public) | — | TC-AUTH-001..015 |

## Priority order (để batch walk-through)

**P0 — Module mới, không có TC**: purchases, receipts, payouts, debts, inventory, settings, content, homepage (8 modules)

**P1 — Module có TC nhưng phần lớn needs-fix/missing**: products, orders, customers, suppliers, users, expenses, chat (7 modules)

**P2 — Coverage tương đối**: dashboard, analytics, categories, supplier-orders, widgets (5 modules)

## Approach

### Phase A — Setup (1 lần)
1. Verify dev server `http://localhost:3001` reachable (qua `mcp__claude-in-chrome__navigate`).
2. Login admin qua Chrome ext, capture screenshot trang dashboard.
3. Tạo plan dir `plans/260512-0214-admin-user-story-tc/test-cases/`.
4. Tạo `INDEX.md` skeleton.

### Phase B — Walk-through từng module
Lặp cho mỗi module theo thứ tự P0 → P1 → P2:

1. **Source code recon** (đọc trước khi mở browser): `_content.tsx`, `page.tsx`, server actions trong `packages/database/src/services/`, schema-related fields.
2. **Browser walk**:
   - Navigate đến route chính.
   - `read_page` để snapshot DOM (filters, columns, actions, empty state).
   - Click vào: create button, một row để vào detail, edit, delete, bulk action, dropdown filter.
   - Capture validation errors (submit form trống, sai format).
   - Test RBAC view nếu thấy điểm khác biệt (skip nếu giống admin).
3. **Write TC file**: `plans/260512-0214-admin-user-story-tc/test-cases/{module}.md` theo template (xem dưới).
4. **Update INDEX.md** với link tới module file vừa viết.

### Phase C — Cross-reference & gap report
1. So sánh user story TCs mới với TC-IDs hiện có trong `docs/035-QA/QA-MOC.md`.
2. Viết `GAP-REPORT.md`: liệt kê (a) TC mới chưa có ở docs, (b) TC docs hiện không match UI, (c) TC docs hiện không cần thiết.

## Test case file template

Mỗi module dùng template sau (Gherkin-style user story), tách 2 nhóm:

```markdown
# Module: <Name> (`/<route>`)

> Walk-through ngày 2026-05-12 trên localhost:3001, user `admin` (Owner).
> Source: `apps/admin/app/(dashboard)/<module>/_content.tsx` + services tương ứng.

## Screen Inventory
- List: `/<route>` — filters, columns, bulk actions, empty state, loading skeleton
- Detail: `/<route>/[id]` — tabs, side panels, inline edit
- Create: `/<route>/new` — form sections, draft/auto-save
- Modals/Dialogs: …
- Toasts/Banners: …

---

## (I) Interaction Test Cases

### US-<MOD>-I001 — <Tương tác cụ thể, vd: Filter status bằng dropdown>

**As** an admin user
**I want to** filter list theo status qua dropdown
**So that** tôi nhanh chóng zoom vào subset cần xem

**Acceptance Criteria**
- AC1 (Happy path): Given list mặc định / When chọn "Draft" trong dropdown / Then URL có `?status=draft`, table chỉ hiện row status=Draft, badge count cập nhật.
- AC2 (Reset): Given filter đang active / When click "Clear" / Then URL hết query, list trở về full.
- AC3 (Keyboard): When focus dropdown + nhấn `Esc` / Then dropdown đóng, focus return về trigger.
- AC4 (Loading): When filter change / Then xuất hiện skeleton row trong <300ms, không có flicker.
- AC5 (URL share): Given URL `/<route>?status=draft` mở trực tiếp / Then list pre-filtered đúng, dropdown hiển thị "Draft".

**UI selectors observed**: `data-testid="status-filter"`, role=combobox, button label "Clear filters".

### US-<MOD>-I002 — Hover/Tooltip trên action button
…

### US-<MOD>-I003 — Form validation real-time (blur vs submit)
…

### US-<MOD>-I004 — Bulk select + bulk action bar xuất hiện
…

### US-<MOD>-I005 — Toast feedback sau khi save thành công / fail
…

---

## (B) Business Test Cases

### US-<MOD>-B001 — <Nghiệp vụ, vd: Status transition rule>

**As** an Owner
**I want to** đảm bảo PO chỉ chuyển status theo workflow hợp lệ
**So that** tránh data corruption (vd: skip receiving)

**Acceptance Criteria**
- AC1 (Valid transition): Given PO status=`pending` / When tôi click "Mark as Ordered" / Then status=`ordered`, `orderedAt` timestamp được set, audit log entry tạo với `changedBy=current user`.
- AC2 (Invalid transition): Given PO status=`received` / When gọi API `PATCH /api/purchases/:id { status: "pending" }` / Then 400 + error code `INVALID_STATUS_TRANSITION`, status không đổi.
- AC3 (RBAC): Given user role=`staff` / When thử mark as ordered / Then 403, UI không hiển thị button.
- AC4 (Concurrency): Given 2 admin cùng mở 1 PO / When cả 2 cùng click "Ordered" / Then 1 succeed, 1 fail với `STALE_VERSION` error; chỉ 1 audit entry tạo.
- AC5 (Idempotency): Given client gửi cùng `Idempotency-Key` 2 lần / Then phản hồi giống nhau, không tạo 2 audit entry.

**Domain references**:
- Service: `packages/database/src/services/purchase.server.ts:transitionStatus`
- Schema: `purchase_orders.status` enum trong `packages/database/src/schema/purchase.ts`
- Spec: `docs/030-Specs/Spec-Order-Management.md#status-machine`

### US-<MOD>-B002 — WAC cost recalculated on receipt
…

### US-<MOD>-B003 — Payment status derived from paid_amount vs total
…

### US-<MOD>-B004 — Audit trail completeness
…

### US-<MOD>-B005 — Validation: negative amount, future date, oversize qty
…

---

## Linked TC-IDs (existing docs)
- TC-<MOD>-XXX (needs-fix) → cover phần `<X>`, miss `<Y>`. New US-<MOD>-Bnnn replaces.

## Notes
- Edge cases unresolved → list ở GAP-REPORT.md.
```

**Conventions**:
- ID prefix `I` = Interaction, `B` = Business. Tránh trộn 2 loại trong 1 story.
- Mỗi module yêu cầu **≥5 Interaction TCs** và **≥5 Business TCs**.
- Mỗi AC phải kiểm chứng được (specific text, code, value), không dùng từ mơ hồ "appropriate"/"correct".

## File structure sau khi xong

```
plans/260512-0214-admin-user-story-tc/
├── plan.md                                # Bản plan này (copy từ ~/.claude/plans)
├── test-cases/
│   ├── INDEX.md                           # Mục lục, link tất cả module
│   ├── 00-login.md                        # /login (entry point)
│   ├── 01-dashboard.md
│   ├── 02-purchases.md                    # P0
│   ├── 03-receipts.md                     # P0
│   ├── 04-payouts.md                      # P0
│   ├── 05-debts.md                        # P0
│   ├── 06-inventory.md                    # P0
│   ├── 07-settings.md                     # P0
│   ├── 08-content.md                      # P0
│   ├── 09-homepage.md                     # P0
│   ├── 10-products.md                     # P1
│   ├── 11-orders.md                       # P1
│   ├── 12-customers.md                    # P1
│   ├── 13-suppliers.md                    # P1
│   ├── 14-users.md                        # P1
│   ├── 15-expenses.md                     # P1
│   ├── 16-chat.md                         # P1
│   ├── 17-analytics.md                    # P2
│   ├── 18-categories.md                   # P2
│   ├── 19-supplier-orders.md              # P2
│   └── 20-widgets.md                      # P2
├── screenshots/                           # captured PNGs từ browser walk
└── GAP-REPORT.md                          # cross-ref với docs/035-QA
```

## Critical files / utilities to reuse

- **Auth flow code**: `apps/admin/app/(public)/login/`, server action xử lý `/api/admin/login`.
- **Login fixture**: `tests/e2e/fixtures/auth.ts` — chứa test creds + login helper, dùng làm chuẩn cho TC auth.
- **Schema source of truth**: `packages/database/src/schema/*.ts` (Drizzle) — kiểm chứng field/validation cho TC validation.
- **Server actions**: `packages/database/src/services/*.server.ts` — đặc biệt `order.server.ts` (vừa edit), purchase, receipt, payout, debt services để viết TC chính xác.
- **UI primitives**: `packages/ui/src/components/` — biết sẵn primitives nào dùng (data-table, dialog, alert-dialog) để TC nêu đúng tên element.
- **Existing TC docs**: `docs/035-QA/Test-Cases/TC-*.md` — đối chiếu để tránh trùng + GAP-REPORT.

## Execution batching

Vì walk 19+ modules là khối lượng lớn, đề nghị **chia thành nhiều phiên** thay vì 1 phát:

- **Session 1**: Setup + P0 (8 modules: purchases, receipts, payouts, debts, inventory, settings, content, homepage)
- **Session 2**: P1 (7 modules: products, orders, customers, suppliers, users, expenses, chat)
- **Session 3**: P2 + login + dashboard + GAP-REPORT (6 modules)

Mỗi session ~1.5–2h. Sau mỗi session commit `plans/260512-0214-admin-user-story-tc/` để bảo toàn tiến độ.

## Interaction vs Business — cheatsheet

| Khía cạnh | Interaction (I) | Business (B) |
|-----------|-----------------|--------------|
| Trigger | UI event (click, hover, blur, keyboard) | Domain action (POST/PATCH, status change, transaction) |
| Assertion | DOM state, URL, focus, toast, skeleton, color | DB state, response code, audit row, computed field |
| Source of truth | UI components, page snapshot | Server action, schema, spec docs |
| Pass criteria | Element visible/clickable/responsive | Invariant đúng (vd: stock không âm, WAC tính chuẩn) |
| Typical edge | Disabled state, double-click, slow network | Concurrency, idempotency, rollback, RBAC, negative input |
| Example | "Click Save khi form invalid → button disabled, error inline hiện" | "Tạo order với SKU không đủ stock → 409, stock không trừ, không có row order tạo" |

Cả 2 cùng tồn tại cho cùng 1 feature. VD module Receipts:
- I: "Khi mở dialog Record Payment, focus trap vào field Amount."
- B: "Khi record payment > remaining balance, server trả 400 và payment.status không đổi."

## Verification

- Mỗi `.md` test case file đọc được như spec hoàn chỉnh: 1 dev mới có thể viết Playwright từ đó mà không cần đọc UI.
- Mỗi user story phải có ≥3 AC (happy + ≥1 validation/error + ≥1 edge).
- Mỗi module ≥5 Interaction TCs **và** ≥5 Business TCs.
- INDEX.md liệt kê đủ 19 modules + link tới cả 2 nhóm.
- GAP-REPORT.md phân loại rõ (new / mismatch / obsolete) với reference TC-ID, ghi rõ TC mới thuộc nhóm I hay B.

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Dev server không seed đủ data → màn empty, không walk được flow đầy đủ | Pre-check: chạy `pnpm db:seed:e2e` nếu màn list rỗng. Document fixture state ở mỗi TC. |
| UI evolve nhanh, TC stale sau vài tuần | Mỗi file ghi `walk-through date` ở header. Walk-through theo commit hiện tại (dev branch HEAD: 6fcc621). |
| Chrome ext disconnect giữa chừng | Save TC sau MỖI module, không gom cuối. INDEX update incremental. |
| Trùng với TC hiện có ở docs/035-QA | Bước Phase C cross-reference để dedupe trước khi merge vào docs/. |

## Open questions (chốt sau approval)

- (a) Có cần walk login/auth flow chi tiết không? Đã có TC-AUTH-001..015 — đề nghị chỉ note diff, không re-define.
- (b) `widgets/` route có phải dev/component-test page không? Nếu yes → skip.
- (c) `supplier-orders` có bị thay thế bởi `purchases` không? Cần xác nhận để khỏi double-cover.
- (d) Có muốn auto-generate Playwright skeleton từ TC sau khi approve không? (out of scope plan này nhưng nếu yes sẽ thêm Phase D)
