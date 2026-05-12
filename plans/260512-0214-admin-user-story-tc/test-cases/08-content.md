# Module: Content — Nội dung website (`/content`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/content/_content.tsx`
> Config types: `@/lib/footer-config`, `@/lib/social-config`
> APIs: `/api/admin/settings/footer`, `/api/admin/settings/social` (GET/PUT)

## Screen Inventory

| Tab | Fields | API |
|-----|--------|-----|
| Footer | Tagline (textarea), Copyright (input). | `/footer` |
| Mạng xã hội | Facebook, Instagram, TikTok, YouTube, Zalo OA URLs (Input with platform icon prefix). | `/social` |

**Pattern**: Independent save button per tab. Mỗi tab có riêng react-query key (`footer_config` / `social_config`). Defaults từ `DEFAULT_FOOTER_CONFIG` / `DEFAULT_SOCIAL_CONFIG`.

---

## (I) Interaction Test Cases

### US-CONTENT-I001 — Footer tab edit + save

**Acceptance Criteria**:
- AC1 (Tagline edit): Gõ vào Textarea → state.footer.tagline cập nhật real-time.
- AC2 (Copyright edit): Same cho Input copyright.
- AC3 (Save success): Click "Lưu footer" → PUT JSON body, toast "Đã lưu footer".
- AC4 (Loading): isPending → button text "Đang lưu...", disabled.
- AC5 (Failure): Non-2xx → toast "Không thể lưu footer".
- AC6 (Optimistic cache update): `queryClient.setQueryData(["footer_config"], saved)` → re-render với data trả về.

### US-CONTENT-I002 — Social tab có icon prefix

**Acceptance Criteria**:
- AC1 (FB icon blue): Field Facebook có icon `Facebook` text-blue-600.
- AC2 (IG icon pink): text-pink-600.
- AC3 (TikTok placeholder ImageIcon): Using lucide `Image` icon (not real TikTok logo). **Note**: Cosmetic.
- AC4 (YT icon red): text-red-600.
- AC5 (Zalo no icon prefix): Field "Zalo OA" chỉ có Input không icon. **Inconsistency**.
- AC6 (Placeholders correct platform URLs): facebook.com/..., instagram.com/..., tiktok.com/@..., youtube.com/@..., zalo.me/...

### US-CONTENT-I003 — Multi-tab independent saves

**Acceptance Criteria**:
- AC1 (Footer edit save): Edit footer + save → social state KHÔNG bị touch.
- AC2 (Social edit save): Reverse.
- AC3 (Switch unsaved): Edit footer → switch to social → switch back → footer unsaved state preserved (component không unmount với Tabs primitive).
- AC4 (Tab focus): Default = "footer".

### US-CONTENT-I004 — Field defaults

**Acceptance Criteria**:
- AC1 (Initial render): State = DEFAULT_FOOTER_CONFIG / DEFAULT_SOCIAL_CONFIG before API load (verify default values in lib files).
- AC2 (API hydrate): When query returns, useEffect overrides state.
- AC3 (Missing fields fallback): API trả thiếu key → spread missing keys với default (verify type-safety from FooterConfig).

### US-CONTENT-I005 — URL field free text (không validate)

**Acceptance Criteria**:
- AC1 (No URL pattern check): Input cho phép gõ "not-a-url" → save success không error.
- AC2 (No required marker): Tất cả social fields optional.
- AC3 (Recommendation**): Add URL validation client-side (HTML5 `type="url"` hoặc regex) + server-side.

### US-CONTENT-I006 — Save button states

**Acceptance Criteria**:
- AC1 (Default): "Lưu footer" / "Lưu liên kết".
- AC2 (Pending): "Đang lưu..." + disabled.
- AC3 (Self-start position): Button left-aligned, not full-width.

---

## (B) Business Test Cases

### US-CONTENT-B001 — Footer config persist GET-then-PUT round trip

**Acceptance Criteria**:
- AC1 (GET initial): Mount → fetch /api/admin/settings/footer returns latest saved.
- AC2 (PUT body shape): {tagline, copyright}.
- AC3 (Server response): Echo saved config; client `setQueryData` with server response (could be normalized).
- AC4 (Race condition): User edits while initial GET still in flight → useEffect sets state from GET data → overrides user input. **UX bug**: Race condition cần guard (only set if state === DEFAULT).
- AC5 (Storage**): Single-row DB table `site_content` hoặc JSON column in settings.

### US-CONTENT-B002 — Social config persist + sanitize

**Acceptance Criteria**:
- AC1 (PUT body): {facebook, instagram, tiktok, youtube, zalo}.
- AC2 (XSS sanitize): URL với `javascript:` scheme → server reject hoặc sanitize.
- AC3 (Storefront render**): `<a href={social.facebook}>` — không escape attribute value → XSS risk nếu store javascript: URL. Verify storefront code path.
- AC4 (Empty value): Empty string → save accepted; storefront hides icon nếu URL empty.

### US-CONTENT-B003 — Storefront footer renders saved config

**Acceptance Criteria**:
- AC1 (Tagline visible): Storefront footer hiển thị `footer.tagline`.
- AC2 (Copyright visible): Hiển thị `footer.copyright` ở footer bottom.
- AC3 (Empty tagline**): Fallback to default OR hide section.
- AC4 (Cache invalidation): Save → next storefront render fetches fresh (ISR / on-demand revalidate `/`).

### US-CONTENT-B004 — Storefront social icons render saved URLs

**Acceptance Criteria**:
- AC1 (Icon visible if URL set): FB/IG/TT/YT/Zalo icons clickable in footer.
- AC2 (Hidden if URL empty): Icon ẩn nếu URL empty.
- AC3 (Target _blank rel noopener**): External links cần `target="_blank" rel="noopener noreferrer"`.
- AC4 (Order): Render order match config keys order (verify trong storefront layout).

### US-CONTENT-B005 — RBAC

**Acceptance Criteria**:
- AC1 (Owner-only?): Có khả năng chỉ Owner edit content (verify policy).
- AC2 (Manager view): Có thể view? — depends.
- AC3 (Staff no access): Sidebar hide hoặc route 403.

### US-CONTENT-B006 — Footer config default seed

**Acceptance Criteria**:
- AC1 (DEFAULT_FOOTER_CONFIG): {tagline: '...', copyright: '...'} có giá trị placeholder ý nghĩa.
- AC2 (First-time use): DB empty → API GET trả về defaults OR empty object → client merges.
- AC3 (Migration**): Default applied on first deploy; subsequent deploys preserve user customization.

### US-CONTENT-B007 — URL injection safety

**Acceptance Criteria**:
- AC1 (Server side validate): URL shape via Zod URL schema → reject malformed.
- AC2 (Strip control chars): Tab/newline trong URL → strip.
- AC3 (Whitelist protocols**): Allow only http/https (block javascript:, data:).

### US-CONTENT-B008 — Audit log on content changes

**Acceptance Criteria**:
- AC1 (Recommendation): Log `who changed what when` cho footer/social → audit accountability.
- AC2 (Current): No audit table observed. Should add.

---

## Linked TC-IDs (existing docs)

- Không có TC-CONTENT-* trong `docs/035-QA/QA-MOC.md`.
- Conceptual:
  - TC-STORE-001 (Storefront Homepage Load) → indirect: footer rendered ở storefront.

## Notes / Edge cases unresolved

- **Race condition initial GET vs user input**: useEffect overrides typing — UX bug.
- **TikTok icon placeholder**: Using lucide `Image` icon — không nhận diện được. Use brand icon.
- **Zalo no icon prefix**: Inconsistent với other social fields.
- **No URL validation**: Free text — typo errors silent.
- **No "Reset to defaults" button**: User cần manual clear.
- **Multi-language footer**: Chỉ 1 ngôn ngữ (VI). Khi có EN/CN store cần i18n.
- **No preview**: User không thấy footer/social preview trước khi save.
- **`/api/admin/settings/footer` vs `/api/admin/settings/shop-info` vs `/api/admin/settings/social`**: 3 endpoints riêng cùng prefix — consolidate vào 1 settings module trong API.
