# Module: Widgets — Tiện ích (`/widgets`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/widgets/_content.tsx` (~60 lines)
> API: `/api/admin/settings/contact-widget` (GET/PUT)

## Screen Inventory

| Screen                           | Notes                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Contact widget config `/widgets` | Single config: Messenger URL cho contact widget xuất hiện trên storefront. Simple form: input + save button. |

**Module type**: Settings-style — config storefront widgets.

---

## (I) Interaction Test Cases

### US-WIDGET-I001 — Load Messenger URL on mount

useEffect GET → set state. Silent fail on error.

### US-WIDGET-I002 — Save Messenger URL

**Acceptance Criteria**:
- AC1 (Click save**): PUT API.
- AC2 (Loading**): contactSaving=true → button "Đang lưu...", disabled.
- AC3 (Success toast**): "Đã lưu".
- AC4 (Failure toast**): "Không thể lưu".

### US-WIDGET-I003 — URL field free text

**Acceptance Criteria**:
- AC1 (No URL validation**): Accept any string. Recommend add HTML5 `type="url"` or regex.
- AC2 (Empty allowed**): Save empty → widget hidden on storefront.

---

## (B) Business Test Cases

### US-WIDGET-B001 — Storefront renders Messenger button if URL set

**Acceptance Criteria**:
- AC1 (URL set**): Float button visible bottom-right.
- AC2 (Click opens new tab**): `target="_blank" rel="noopener"`.
- AC3 (URL empty**): Button hidden.

### US-WIDGET-B002 — URL whitelist scheme

**Acceptance Criteria**:
- AC1 (https only**): Reject javascript: / data: schemes.
- AC2 (m.me or facebook.com**): Validate domain? Or accept any URL?

### US-WIDGET-B003 — RBAC

Owner only? Verify.

### US-WIDGET-B004 — Cache invalidation

Storefront cache revalidate after save.

---

## Linked TC-IDs

Không có TC-WIDGET-* trong `docs/035-QA/QA-MOC.md`. Module mới.

## Notes

- Single config — should expand to support: Zalo widget, hotline call, live chat trigger, custom HTML embed.
- No preview before save.
- No URL validation.
- Future: scheduled visibility (chỉ hiện business hours).
- Cross-ref: Settings module + Content module (Social media URLs trùng concept).
