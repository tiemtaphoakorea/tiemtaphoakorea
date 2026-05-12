# Module: Settings — Cửa hàng (`/settings`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/settings/` (_content, _branding-panel, _color-pair-picker)
> APIs: `/api/admin/settings/shop-info` (GET/PUT), `/api/admin/customers/tier-config` (GET/PUT).
> Helpers: `@/lib/print-invoice` → `clearShopInfoCache()`.

## Screen Inventory

| Screen / Tab | Notes |
|--------------|-------|
| Tab "Cửa hàng" | Shop info form (name required, address textarea, phone, taxId, SEO description max 160, SEO keywords). Save button. |
| Tab "Nhận diện" | BrandingPanel — logo upload + color-pair-picker (theme colors). |
| Tab "Hạng khách hàng" | CustomerTierPanel — thresholds cho loyal/frequent tiers (số đơn + tổng chi tiêu). |

**State**: Each tab has its own local state + save action; no shared "Save" button.

---

## (I) Interaction Test Cases

### US-SET-I001 — Tab switching giữ unsaved state cục bộ

**Acceptance Criteria**:
- AC1 (Initial tab): Default `store`.
- AC2 (Switch + edit + switch back): Tab store → edit name → switch to branding → switch back → name vẫn giữ (component không unmount), CHƯA save.
- AC3 (Save indicator per panel): Mỗi panel có nút save riêng → trạng thái pending độc lập.
- AC4 (Tab visual): `Tabs variant="line"` style — active tab có underline.

### US-SET-I002 — Initial load shop info từ API

**Acceptance Criteria** (`_content.tsx:38-50`):
- AC1 (GET on mount): useEffect fetch `/api/admin/settings/shop-info` once.
- AC2 (Populate fields): Response.data → setShopName/Address/Phone/TaxId/seoDescription/seoKeywords.
- AC3 (Missing fields default ""): API trả thiếu field → state = "".
- AC4 (Error swallowed): `.catch(() => {})` — silent fail, không toast. **UX gap**: nên log/toast.
- AC5 (Race condition): Re-mount component → re-fetch overrides user input (chỉ chạy 1 lần do `[]` deps).

### US-SET-I003 — Save shop info validation

**Acceptance Criteria**:
- AC1 (Empty name): `shopName.trim()===""` / Click save / Toast error "Tên cửa hàng không được để trống", NO API call.
- AC2 (Trimmed name): " Tiệm A " → save body has `name: "Tiệm A"` (trim before PUT).
- AC3 (SEO max enforce): seoDescription > 160 chars → UI: textarea `maxLength=160` blocks gõ. Save also `.slice(0,160)` defensive.
- AC4 (Success toast): "Đã lưu thông tin cửa hàng".
- AC5 (Failure toast): non-2xx → "Không thể lưu thông tin cửa hàng".
- AC6 (Loading state): `shopSaving=true` → button text "Đang lưu...", `disabled`.
- AC7 (clearShopInfoCache): On success → clear in-memory cache để next print invoice load fresh data.

### US-SET-I004 — SEO description counter color change

**Acceptance Criteria** (`_content.tsx:146-150`):
- AC1 (Below 150): counter text `text-muted-foreground` (gray).
- AC2 (≥ 150 chars, < 160): counter `text-destructive` (red) — warning zone.
- AC3 (Counter format): "{length}/{160}".
- AC4 (maxLength prevent overflow): textarea won't accept beyond 160.

### US-SET-I005 — Customer tier validation

**Acceptance Criteria** (`saveMutation.mutationFn`):
- AC1 (Min orders <1): loyalMinOrders=0 → throw "Số đơn tối thiểu phải ≥ 1".
- AC2 (Negative spent): loyalMinSpent=-100 → throw "Tổng chi tiêu tối thiểu phải ≥ 0".
- AC3 (NaN values): empty fields → Number("")=0 — finite, passes Number.isFinite. Then triggers AC1 (0 < 1).
- AC4 (Both tiers): All 4 fields validated.
- AC5 (After save): Invalidate `customers.tierConfig` + `customers.all` → list customers re-classify.

### US-SET-I006 — Customer tier defaults trong state

**Acceptance Criteria** (`CustomerTierPanel:195-198`):
- AC1 (Initial defaults): loyalMinOrders="10", loyalMinSpent="5000000", frequentMinOrders="5", frequentMinSpent="2000000" — displayed before API load completes.
- AC2 (After load): useEffect overwrites with `cfg` values.
- AC3 (NumberInput format): 5000000 → "5,000,000" visual (locale formatting), value "5000000" raw.

### US-SET-I007 — Branding panel (logo + color pair picker)

**Acceptance Criteria** (assumption — verify `_branding-panel.tsx` + `_color-pair-picker.tsx`):
- AC1 (Logo upload): Accept image MIME, max size limit (likely 2-5MB), preview after upload.
- AC2 (Color pair picker): Visual swatches; click to select; pair = primary+secondary or primary+foreground.
- AC3 (Save scope): Branding save independent from shop info save.
- AC4 (Preview live): Color change preview applies trên cụm UI demo trong panel trước khi save?

### US-SET-I008 — Required vs optional fields labelling

**Acceptance Criteria**:
- AC1 (Required visual): "Tên cửa hàng" KHÔNG có asterisk visible — chỉ throw error toast on submit empty. **UX gap**: Cần marker.
- AC2 (Optional marker): "Mã số thuế" label "(tuỳ chọn)" explicit.
- AC3 (Other optional implicit): Address, phone, SEO không có "(tuỳ chọn)" marker — implicit by accepting empty.

### US-SET-I009 — Buttons align self-start (left)

**Acceptance Criteria**:
- AC1 (Save button left-aligned): Class `self-start` → button không full-width.
- AC2 (Disabled state): isPending → btn disabled; user click → no-op.

---

## (B) Business Test Cases

### US-SET-B001 — Shop info persistence end-to-end

**Acceptance Criteria**:
- AC1 (PUT body shape): JSON body có exact keys {name, address, phone, taxId, seoDescription, seoKeywords}.
- AC2 (DB column mapping): API mapping name → store_settings.name (assumed schema), etc.
- AC3 (PII handling): Phone/TaxId stored as-is, no encryption (consider for compliance).
- AC4 (Single-tenant assumption): No multi-tenant `shop_id` — schema = single row table or composite key.
- AC5 (Cache propagation): After save → `clearShopInfoCache()` flushes app-level cache. Print invoice fetches fresh data.

### US-SET-B002 — Customer tier auto-classification job

**Acceptance Criteria** (cross-module, customer tier logic):
- AC1 (Loyal): customer với `orderCount ≥ loyalMinOrders AND totalSpent ≥ loyalMinSpent` → tier='loyal'.
- AC2 (Frequent): `orderCount ≥ frequentMinOrders AND totalSpent ≥ frequentMinSpent` (and not loyal) → tier='frequent'.
- AC3 (Regular): Below frequent threshold → tier='regular' (default).
- AC4 (Re-classify on threshold change): After save → invalidate `customers.all` → customers list refetch with new tiers.
- AC5 (Background job vs realtime): Tier auto-computed on read? Or stored field? Verify implementation.
- AC6 (Edge: order count = threshold exactly): qualify (≥ inclusive).

### US-SET-B003 — Tier hierarchy invariant: loyal ≥ frequent

**Acceptance Criteria**:
- AC1 (Logical check): loyalMinOrders > frequentMinOrders typically. UI **không enforce** — user có thể đặt loyalMinOrders=3, frequentMinOrders=10 → loyal threshold thấp hơn frequent.
- AC2 (Recommendation): Add validation: loyalMinOrders >= frequentMinOrders AND loyalMinSpent >= frequentMinSpent.
- AC3 (Current behavior with inverted): Customer order=5 → đạt frequent (≥3) nhưng cũng đạt loyal (≥3) → ambiguity. Cần document priority rule.

### US-SET-B004 — SEO description rendered on storefront

**Acceptance Criteria**:
- AC1 (Meta tag): Storefront `<head>` có `<meta name="description" content="{seoDescription}">`.
- AC2 (Open Graph): Optional og:description = same value.
- AC3 (Default fallback): seoDescription empty → default text từ env hoặc hardcoded.
- AC4 (Cache invalidation): After save → storefront cache invalidated within X seconds (verify with ISR/revalidate).

### US-SET-B005 — Shop info used trên invoice print

**Acceptance Criteria**:
- AC1 (Render shop name): print-invoice helper inject `name`, `address`, `phone`, `taxId` vào HTML template.
- AC2 (Cache hit): First print fetches shop info; subsequent prints within session use `print-invoice` cache.
- AC3 (After save): clearShopInfoCache() → next print fetches fresh.
- AC4 (Missing taxId): Template gracefully hide taxId line nếu empty.

### US-SET-B006 — RBAC: chỉ Owner update settings

**Acceptance Criteria**:
- AC1 (Manager view): Manager có thể view /settings.
- AC2 (Manager save shop info): API PUT → 403 hoặc 200? — verify business policy (Settings là Owner-only?).
- AC3 (Manager save tier config): Same question.
- AC4 (Staff): KHÔNG có access (sidebar hide, route guard 403).

### US-SET-B007 — Branding upload validation

**Acceptance Criteria** (verify `_branding-panel.tsx`):
- AC1 (MIME): Accept image/png, image/jpeg, image/webp, image/svg+xml.
- AC2 (Size limit): Max 2MB (or per policy).
- AC3 (Server validate): API endpoint re-validates MIME + size + dimensions.
- AC4 (Storage path): Upload tới Supabase Storage `brand-assets/` (assumed) với public URL.
- AC5 (Delete old on replace): Old logo deleted khi upload new (cleanup).

### US-SET-B008 — Color pair persistence + CSS variables

**Acceptance Criteria**:
- AC1 (CSS var injection): Selected colors → CSS variables (`--primary`, `--primary-foreground`, etc.) injected at storefront layout root.
- AC2 (Contrast guarantee): Color pair design ensures min 4.5:1 contrast (WCAG AA) — handled by `_color-pair-picker.tsx` (curated palette).
- AC3 (Storefront immediate apply): After save → storefront refresh shows new theme.
- AC4 (Admin preview): Live preview trong panel before save.

### US-SET-B009 — SEO description max 160 server-side enforced

**Acceptance Criteria**:
- AC1 (Body length validation): API PUT body có seoDescription length > 160 → server clamps or rejects.
- AC2 (Client double-defense): `.slice(0, SEO_DESCRIPTION_MAX)` ở client cũng.
- AC3 (Bypass UI): curl PUT với 1000 chars → server truncate hoặc 400.

### US-SET-B010 — Cache `clearShopInfoCache` scope

**Acceptance Criteria**:
- AC1 (In-memory): Hàm chỉ clear in-memory map của module print-invoice.
- AC2 (Server-side cache): Server vẫn có thể có cache (verify Next.js fetch cache / RSC).
- AC3 (CDN/edge): Storefront SSG/ISR — revalidate path needed nếu shop info embedded.

### US-SET-B011 — Phone number không validate format

**Acceptance Criteria**:
- AC1 (Free text): "Số điện thoại" Input chấp nhận mọi text — verify với "abc123".
- AC2 (No regex check): Save với phone="abc" → success (lax).
- AC3 (Recommendation): Add regex `^[0-9+\-\s()]{6,20}$` validation client + server.

---

## Linked TC-IDs (existing docs)

- Không có TC-SET-* hoặc TC-SETTINGS-* trong `docs/035-QA/QA-MOC.md`.
- TC-CUST-005 (Customer Classification Change) ≈ US-SET-B002 (tier auto-classify after threshold change).
- TC-STORE-001 (Storefront Homepage Load) → có thể chạm meta description từ US-SET-B004.

## Notes / Edge cases unresolved

- **No "unsaved changes" warn**: Switch tab + reload — user mất data, không có dialog.
- **No optimistic update**: Save → wait response → toast. Có thể optimistic.
- **Empty error swallow**: `.catch(() => {})` on initial fetch — silent fail. Cần toast.
- **Custom tier names**: Tier names cứng (loyal/frequent/regular) — không user-configurable.
- **No audit log for settings change**: Ai đổi gì khi nào → không log. Cần `settings_audit_log` table.
- **Multi-tenant readiness**: Single-row settings — cần `shop_id` FK khi scale.
- **Phone/TaxId format validation**: Missing.
- **Loyal vs Frequent threshold inversion**: Allowed currently; should guard.
- **BrandingPanel**: Not walked — need separate detailed pass for color picker accessibility, logo upload flow.
- **Settings export/import**: Không có. Useful cho replication.
