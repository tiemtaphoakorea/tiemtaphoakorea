# Reviewer-Admin · Hardcode & API chưa nối — apps/admin

Branch: dev. Scope: `apps/admin/**`. Date: 2026-05-03.

## Tóm tắt

Phần lớn trang trong admin app dùng react-query/mutation đúng pattern (chat, customers, supplier-orders, homepage banner/collection, settings/footer/social/widget, inventory adjustment...). Tuy nhiên còn một số chỗ render dữ liệu cứng trông như số liệu thật (dashboard 7-day chart, customer profile email/return rate), một panel trong Settings có UI nhưng không lưu (Branding tab), và logic phân hạng KH local đè lên config admin đã lưu. Có 1 file legacy (banner-form cũ) không còn ai import.

Counts: **CRITICAL: 6** · **IMPORTANT: 4** · **MODERATE: 4**

---

## CRITICAL

### 1. Dashboard charts — 7-day series cứng + delta giả
`apps/admin/app/(dashboard)/_content.tsx:38-56,155`

```ts
// 7-day series — kept as static placeholder until backend exposes time-series endpoint.
const REVENUE_DATA = [{ l: "T2", v: 42 }, ..., { l: "CN", v: 110 }];
const ORDERS_DATA  = [{ l: "T2", v: 18 }, ..., { l: "CN", v: 52 }];
```

Cả 2 BarChart "Doanh thu 7 ngày" và "Đơn hàng 7 ngày" đều dùng mảng cứng. Trang `/analytics/finance` đã có endpoint `getDailyFinancialStats` (xem `index-card-finance-trend.tsx:39`) — đáng lẽ dùng được.

Còn thêm hardcoded delta:

```tsx
<TonePill tone="green">+18% tuần trước</TonePill>  // line 155
```

Hiển thị "+18% tuần trước" cho mọi user, mọi tuần. Misleading vì 4 KPI cards trên cùng đã render data thật từ API.

### 2. Customer profile — email bịa từ customerCode
`apps/admin/components/admin/customer-detail/customer-profile-header.tsx:64-67`

```tsx
<span className="text-xs">
  {(customer.customerCode || "unknown").toLowerCase()}
  @shop.internal
</span>
```

Label "Email hệ thống" rồi ghép `customerCode + @shop.internal`. Đây không phải email thật. Nếu muốn placeholder thì phải nói rõ là synthetic; còn nếu schema có `customer.email` thì dùng field đó. CSAT/CS sẽ gọi vào email không tồn tại.

### 3. Customer financial stats — "Tỉ lệ hoàn 0%" cứng
`apps/admin/components/admin/customer-detail/customer-financial-stats.tsx:35`

```tsx
<div className="space-y-1 rounded-3xl bg-slate-50 p-4">
  <span className="...">Tỉ lệ hoàn</span>
  <div className="text-xl font-black">0%</div>   // ← always 0
</div>
```

Ô "Tỉ lệ hoàn" hiển thị `0%` cho mọi khách. Không có prop, không có query, chỉ là chuỗi cứng.

### 4. Customer tier — thresholds cứng đè lên config đã lưu
`apps/admin/app/(dashboard)/customers/_content.tsx:35-40`

```ts
function customerTier(totalSpent: number): { label: string; tone: BadgeTone } {
  if (totalSpent >= 5_000_000) return { label: "VIP", tone: "amber" };
  if (totalSpent >= 1_000_000) return { label: "Regular", tone: "indigo" };
  return { label: "New", tone: "gray" };
}
```

Trong khi `apps/admin/app/(dashboard)/settings/_content.tsx:200-241` đã wire xong API `getCustomerTierConfig`/`updateCustomerTierConfig` (admin có thể chỉnh `loyalMinSpent / frequentMinSpent`). Bảng KH bỏ qua config đó, dùng 5M/1M cứng và label khác hẳn (VIP/Regular/New thay vì Loyal/Frequent). User vào Settings chỉnh ngưỡng → trang KH vẫn hiển thị cũ. Inconsistent.

Comment trên hàm cũng tự thừa: `"replicates business rule until tier-config is wired"` — config đã wire xong.

### 5. Settings → Branding tab — UI có, lưu không có
`apps/admin/app/(dashboard)/settings/_content.tsx:131-183`

```tsx
<TabsContent value="branding" className={PANEL_CLS}>
  <FileUploader value={logoMain} onChange={setLogoMain} ... />     // logoMain state ko save
  <FileUploader value={logoSquare} onChange={setLogoSquare} ... /> // logoSquare state ko save
  <Input defaultValue="" />                                        // logo accent — uncontrolled
  <Input defaultValue="#6366F1" />                                 // brand color — uncontrolled, ko save
  <Input defaultValue="#F59E0B" />                                 // accent color — uncontrolled
  <Button className="self-start">Lưu nhận diện</Button>            // ← KHÔNG có onClick
</TabsContent>
```

Toàn bộ tab Branding hiện chỉ là UI fake: button "Lưu nhận diện" không có handler, các input chỉ `defaultValue` (uncontrolled, không gắn state), upload logo có state nhưng không có mutation. User upload logo → reload mất sạch.

Cùng file `Tabs` còn lại (Cửa hàng + Hạng KH) thì đầy đủ — chứng tỏ đây là TabsContent chưa hoàn thiện chứ không phải design intent.

### 6. Order/Customer export — silently truncates ở 5000 dòng
`apps/admin/app/api/admin/customers/export/route.ts:6,30`
`apps/admin/app/api/admin/orders/export/route.ts:6,30`

```ts
const EXPORT_LIMIT = 5000;
// ...
const { data } = await getCustomers({ page: 1, limit: EXPORT_LIMIT });
```

Cả 2 export route đều cắt cứng tại 5000 không check `metadata.total`. Khi shop có >5000 KH/đơn, file CSV thiếu dòng nhưng UI báo "Xuất danh sách" thành công → mất dữ liệu im lặng. Tối thiểu nên: (1) loop pagination, hoặc (2) trả 4xx + thông báo "vui lòng dùng filter ngày" khi quá ngưỡng.

---

## IMPORTANT

### 7. Branding tab inputs uncontrolled
`apps/admin/app/(dashboard)/settings/_content.tsx:158, 167, 177`

`<Input defaultValue="" />` và `<Input ... defaultValue="#6366F1" />` không có `value`/`onChange`. Bonus: nếu sau này gắn save thì không lấy được giá trị. Đã cover ở Critical #5 nhưng tách ra để fix trực diện.

### 8. Inventory adjustment — yêu cầu user gõ tay variant UUID
`apps/admin/components/admin/inventory/movements-tab.tsx:186-194`

```tsx
<FieldLabel htmlFor="variantId">Variant ID</FieldLabel>
<Input id="variantId" value={variantId} placeholder="Nhập variant ID" required />
```

Không phải hardcode/mock theo nghĩa kỹ thuật, nhưng UI buộc nhân viên kho copy-paste UUID từ đâu đó. `getProductsWithVariants` đã có (xem `supplier-orders/_content.tsx:222-227`), dùng `<Select>` + variant list để chọn. Hiện state form không scale với người không phải dev.

### 9. `customerType === "retail"` ternary — gom mọi giá trị khác vào "Khách sỉ"
`apps/admin/components/admin/customer-detail/customer-profile-header.tsx:79`

```tsx
<span>{customer.customerType === "retail" ? "Khách lẻ" : "Khách sỉ"}</span>
```

Nếu `customerType` null/undefined/missing → hiển thị "Khách sỉ" như đã set là wholesale. An toàn hơn: explicit `null → "—"`.

### 10. Axios call `/api/admin/products` không qua API_ENDPOINTS
`apps/admin/components/admin/products/product-form.tsx:518, 526`

```ts
res = await axios.post("/api/admin/products", createPayload);
res = await axios.put(`/api/admin/products/${productId}`, updatePayload);
```

Codebase đã có 86 chỗ dùng `API_ENDPOINTS.*` constant (xem `git log` commit b55e154). Hai chỗ này còn lại đường dẫn cứng bằng string — dễ drift khi rename route.

---

## MODERATE

### 11. File legacy `banner-form.tsx` không ai import
`apps/admin/components/admin/banners/banner-form.tsx`

Chỉ self-reference (`grep -rn "BannerForm\b"` cho 1 dòng). Code hiện tại dùng `BannerFormPanel` ở `app/(dashboard)/homepage/_components/`. File cũ chứa default values + state → confuse khi đọc. Xoá.

### 12. Local `UserWithStatus` extension thừa sau khi `AdminProfile` thêm `isActive`
`apps/admin/app/(dashboard)/users/_components/user-row-actions.tsx:11-19`

```ts
type UserWithStatus = AdminProfile & { isActive?: boolean | null };
// ...
const isActive = (user as UserWithStatus).isActive ?? true;
```

Sau diff `packages/database/src/types/admin.ts` (staged), `AdminProfile` đã có `isActive?: boolean | null`. Cast & extension này không còn cần — `user.isActive ?? true` là đủ.

### 13. Dashboard `_content.tsx` — comment nói "kept as static placeholder until backend exposes..."
Đây là TODO ngầm không có ticket/marker. Nên thay bằng `// TODO(ENG-XXX):` hoặc xoá khi fix Critical #1.

### 14. Hai export route lặp y hệt `toCsv` helper
`apps/admin/app/api/admin/customers/export/route.ts:8-21`
`apps/admin/app/api/admin/orders/export/route.ts:8-21`

DRY: extract về `apps/admin/lib/csv.ts`. Hiện mỗi route có 1 bản identical 14 dòng. Nhỏ thôi.

---

## Các câu hỏi chưa giải đáp

1. **Dashboard 7-day chart**: backend có endpoint nào trả time-series 7 ngày cho doanh thu/đơn không, hay phải dùng `getDailyFinancialStats` rồi slice 7 entries cuối? (Quyết định cách fix Critical #1.)

2. **Customer email**: schema `customers` có field `email` thật không? Nếu có → dùng nó. Nếu không → label nên đổi (vd "Định danh") hoặc hide hẳn block. (Liên quan Critical #2.)

3. **Customer return rate**: có bảng `order_returns`/`refunds` không, hay tính từ `order.fulfillmentStatus = "cancelled"`? (Critical #3 cần biết source-of-truth.)

4. **Settings Branding**: design intent là lưu vào setting key như `branding_config` (giống `homepage_config`/`footer_config`) hay tab này pending hẳn? Nếu pending → ẩn TabsTrigger, đừng để user vào rồi mất data.

5. **Customer tier**: muốn dùng config từ Settings hay hard rules cho consistency với mobile/main app? Cần align UX trước khi sửa Critical #4.

6. **Export limit 5000**: business rule là "tối đa 5000/lần" hay đây là dev-time guard? Cần kết luận trước khi fix Critical #6.

---

**Status:** DONE
**Summary:** Admin app review xong. Critical 6, Important 4, Moderate 4. Phần lớn UI đã wired API; vấn đề lớn nằm ở dashboard placeholders, customer detail synthetic data, settings branding tab chưa save, và customer-tier ignore admin config.
