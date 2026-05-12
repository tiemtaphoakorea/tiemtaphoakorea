# Audit & Phương án Restructure Categories + Products

**Ngày:** 2026-05-05
**DB:** Supabase `tiemtaphoakorea` (project `rwqjikceeyrqexshdjdr`)
**Tổng SP:** 1.396 — **Tổng Variants:** 3.256 — **Tổng Categories:** 11

---

## 1. Hiện trạng (Tổng quan)

### 1.1 Categories — chỉ có nhánh "Kính mắt"

| # | Tên | Slug | Parent | SP | Vấn đề |
|--|-----|------|--------|----|----|
| 1 | Kính mắt | `kinh-mat` | — | 1 | OK (root) — nhưng đang chứa 1 SP lẻ chưa map vào sub |
| 2 | RT1 — Classic | `rieti-rt1-classic` | Kính mắt | 12 | "RT1 —" là code nội bộ, hiển thị khách rối |
| 3 | RT2 — Round | `rieti-rt2-round` | Kính mắt | 4 | Như trên |
| 4 | RT3 — Premium TR-90 | `rieti-rt3-premium-tr90` | Kính mắt | 3 | Như trên |
| 5 | RT4 — Acetate | `rieti-rt4-acetate` | Kính mắt | 21 | Như trên |
| 6 | RT5 — Light | `rieti-rt5-light` | Kính mắt | 2 | Như trên |
| 7 | RT6 — Metal | `rieti-rt6-metal` | Kính mắt | 7 | Như trên |
| 8 | **RT7 — New Arrivals** | `rieti-rt7-new-arrivals` | Kính mắt | 2 | ⛔ **TRÙNG TÊN với RT8** |
| 9 | **RT8 — New Arrivals** | `rieti-rt8-new-arrivals` | Kính mắt | 2 | ⛔ **TRÙNG TÊN với RT7** |
| 10 | Latest Collection | `rieti-latest-collection` | Kính mắt | 20 | ⚠️ Tên không phân loại — gần như duplicate "New Arrivals" |
| 11 | Special | `rieti-special` | Kính mắt | 1 | ⚠️ Tên quá vague (1 SP) |

**Tổng SP có category:** 75 / 1.396 → **94,6% SP đang `category_id = NULL`** (1.321 SP).

### 1.2 Products — phân bố độ dài tên

| Bucket | Số SP | % |
|--------|------:|--:|
| ≤20 | 323 | 23% |
| 21–40 | 513 | 37% |
| 41–60 | 312 | 22% |
| 61–80 | 162 | 12% |
| 81–100 | 66 | 5% |
| **>100** | **20** | **1.4%** |

- **Avg:** 39 ký tự — **Max:** 132 ký tự
- Khuyến nghị: tên SP hiển thị đẹp ≤ **60 ký tự**, tốt nhất 40–55

### 1.3 Phân loại SP theo nội dung tên (heuristic)

| Nhóm lớn | Ước SL | Ghi chú |
|----------|------:|---------|
| Thời trang (quần áo + giày + túi + mũ + tất + trang sức) | ~482 | Mảng lớn nhất |
| Mỹ phẩm (skincare + makeup + suncare + fragrance) | ~397 | Mảng thứ 2 |
| Kính mắt (Rieti + khác) | ~96 | Đã có cây sẵn |
| Thực phẩm / TPCN | 40 | |
| Body & Hair Care | 18 | |
| Gia dụng | 12 | |
| Mẹ & Bé | 4 | |
| **Chưa xác định** | **347** | Cần review tay |

---

## 2. Vấn đề cụ thể

### 2.1 Vấn đề Categories
1. **Trùng tên (CRITICAL):** RT7 và RT8 cùng tên "New Arrivals" → khách hàng & admin không phân biệt được.
2. **Tên không có nghĩa:** "Latest Collection" (20 SP), "Special" (1 SP) — không nói lên đặc điểm sản phẩm (chất liệu, kiểu dáng).
3. **Tiền tố "RT[n] —"** là SKU code nội bộ, hiển thị front-end khó đọc (khách không biết RT là gì).
4. **Chỉ có 1 ngành (Kính):** trong khi shop thực tế bán Mỹ phẩm, Thời trang, TPCN… → toàn bộ phần còn lại không có cấu trúc browsing.
5. **Trùng concept:** "Latest Collection" + "New Arrivals" = cùng nghĩa.

### 2.2 Vấn đề Product Names

| Vấn đề | Số SP | Ví dụ |
|--------|------:|-------|
| Bắt đầu bằng `(` (tag điều kiện đóng gói) | 33 | `( 1 gói) Sample Kem Chống Lão Hóa OHUI…` |
| Có "fullbox" / "unbox" trong tên | 31 | `( Fullbox )Tinh chất tự sinh Bichup…` |
| Có "Sample" trong tên (nên là variant, không phải SP riêng) | 31 | `Sample Tinh Chất…` |
| Có "Tách set" / "Lẻ 1 …" (cùng vấn đề) | 31 | `( Tách set ) Kem Dưỡng Cấp Nước…` |
| Có "Shopee" — leak channel | 3 | `Shopee _ Sample Tinh chất…` |
| Có ≥ 2 space liên tiếp | 138 | `… Sum 37  LosecSumma …` |
| Có dấu `_` (separator lạ trong tên hiển thị) | 63 | `Tách set Unbox Tone 21 _ Phấn nước…` |
| **Trùng tên exact (cần merge / rename)** | 6 nhóm × 2 | `Mediheal-MADECASSOSIDE`, `Mediheal-TEATREE`, `Mediheal-VITAMIN C`, `Cushion Dalba - Khách OD`, `Áo khoác nữ Spao chần bông cổ cao SPJAE 4TG92`, `Váy ren quần trong dây rút` |
| Tên dài >100 ký tự | 20 | `Shopee _ Sample Tinh chất Vitamin C Ohui The First Vitamin Complex 8.0% chống lão hóa, làm trắng da và duy trì độ ẩm 1ml ( 1 sample)` (132 ký tự) |
| Tên cực ngắn không brand context | ~80 | `ALI`, `EVA`, `ROMEO`, `TÚi JW`, `Sữa OPO`, `Tựa lưng` |

### 2.3 "Variant đáng lẽ nên là Variant, lại là Product riêng"

Đây là **anti-pattern lớn nhất**: rất nhiều SP chênh nhau chỉ ở **dung tích / màu / dạng đóng gói** (Fullbox, Unbox, Tách set, Sample, Mini, …) nhưng đang là 2–4 product khác nhau. Schema đã có `product_variants` và `variant_images` đầy đủ → **những biến thể này phải gom về cùng 1 product, tách ra thành variant**.

Ví dụ điển hình:
- `( Fullbox ) Set 2 lọ Kem Chống Nắng …Cell Fusion C…` + `( Tách set ) Kem Dưỡng Cấp Nước Sum37…` → cùng 1 SP gốc nhưng tag đóng gói khác.
- `Lẻ 1 cây Mascara CLIO…` vs `Mascara CLIO…` → cùng SP, "lẻ 1 cây" là quantity description.
- `Kem tẩy lông Freemo… Màu xanh` + `Kem tẩy lông Freemo… Màu hồng` → cùng SP, biến thể màu.

---

## 3. Phương án xử lý (đề xuất)

### 3.1 Cấu trúc Categories mới (3 cấp, gốc theo ngành)

```
Mỹ phẩm (my-pham)
├── Chăm sóc da mặt (skincare)
│   ├── Tinh chất & Serum (essence-serum)
│   ├── Kem dưỡng (moisturizer)
│   ├── Mặt nạ (mask)
│   ├── Sữa rửa mặt & Tẩy trang (cleanser)
│   ├── Toner & Xịt khoáng (toner-mist)
│   └── Tẩy tế bào chết (exfoliator)
├── Chống nắng (suncare)
├── Trang điểm (makeup)
│   ├── Phấn nước & Cushion (cushion)
│   ├── Kem nền & Che khuyết điểm (foundation)
│   ├── Son môi (lipstick)
│   ├── Son dưỡng (lip-balm)
│   ├── Trang điểm mắt (eye-makeup)
│   └── Má hồng (blush)
└── Nước hoa (fragrance)

Chăm sóc cơ thể (body-hair-care)
├── Body (body)
├── Tóc (hair)
└── Răng miệng (oral-care)

Thực phẩm & Sức khoẻ (health-food)
├── TPCN dưỡng da & nội tiết (supplement-skin)
├── TPCN bổ gan, giải độc (supplement-liver)
├── Sữa & dinh dưỡng trẻ em (kids-nutrition)
└── Khác (other-supplement)

Thời trang (fashion)
├── Quần áo nữ (women-clothing)
├── Quần áo nam (men-clothing)
├── Giày dép (footwear)
├── Túi & Balo (bags)
├── Mũ & Phụ kiện đầu (hats)
├── Tất & Vớ (socks)
└── Trang sức (jewelry)

Kính mắt (eyewear)         ← giữ root cũ, đổi slug `kinh-mat` → `eyewear` hoặc giữ
├── Rieti — Acetate (rieti-acetate)
├── Rieti — Metal (rieti-metal)
├── Rieti — Classic / Round (rieti-classic-round)   ← gộp 2 nhóm cùng tinh thần "khung cơ bản"
├── Rieti — Premium TR-90 (rieti-tr90)
├── Rieti — Light (rieti-light)
├── Rieti — Bộ sưu tập mới (rieti-new-collection)   ← gộp RT7+RT8+Latest Collection
└── Kính khác (Reclow, McCoin, …) (eyewear-other)

Gia dụng & Phụ kiện (lifestyle)
└── (chăn, ly, sạc, bộ ảnh, light stick…)

Mẹ & Bé (mom-baby)         ← chỉ tạo nếu định scale, hiện 4 SP có thể merge tạm vào Sức khoẻ/Thời trang trẻ em
```

**Lưu ý:** `categories.parent_id` đã tồn tại — chỉ cần `INSERT` cây mới + `UPDATE products.category_id`. Slug đã có unique index nên cần đặt slug mới không trùng.

### 3.2 Xử lý 11 categories cũ (Kính mắt)

| Hành động | Cũ | Mới |
|-----------|----|----|
| **MERGE** | RT7 — New Arrivals + RT8 — New Arrivals + Latest Collection | "Rieti — Bộ sưu tập mới" (`rieti-new-collection`) |
| **RENAME** | RT1 — Classic | "Rieti — Classic" (drop tiền tố RT, hoặc giữ làm tag display_order) |
| **RENAME** | RT2 — Round | "Rieti — Round" hoặc gộp với Classic thành "Rieti — Cơ bản" |
| **RENAME** | RT3 — Premium TR-90 | "Rieti — Premium TR-90" |
| **RENAME** | RT4 — Acetate | "Rieti — Acetate" |
| **RENAME** | RT5 — Light | "Rieti — Siêu nhẹ" |
| **RENAME** | RT6 — Metal | "Rieti — Khung kim loại" |
| **DELETE** (move 1 SP) | Special | move 1 SP vào "Rieti — Bộ sưu tập mới" |
| **GIỮ** | Kính mắt (root) | Giữ — thêm sub "Kính khác" cho 31 SP non-Rieti |

Sau khi gộp: từ **10 sub** xuống còn **6–7 sub** dễ điều hướng.

### 3.3 Quy tắc đặt tên Sản phẩm (Style Guide)

```
[Loại SP] [Tên brand & dòng (EN)] [Đặc điểm chính] [Dung tích/Số lượng]
```

**Ví dụ áp dụng:**

| Trước (xấu) | Sau (đẹp) | Giảm |
|--|--|--|
| `Shopee _ Sample Tinh chất Vitamin C Ohui The First Vitamin Complex 8.0% chống lão hóa, làm trắng da và duy trì độ ẩm 1ml ( 1 sample)` (132) | `Tinh chất Vitamin C Ohui The First 8.0% — 1ml` (47) → đẩy "Sample" thành **variant**, "Shopee" loại bỏ | -85 |
| `( Fullbox ) Set 2 lọ Kem Chống Nắng Cho Da Dầu, Da Mụn Cell Fusion C Clear Sunscreen 100 SPF 48+/PA+++ 35ml` (107) | `Kem chống nắng Cell Fusion C Clear Sunscreen 100 SPF48+ — 35ml` (62) → "Fullbox", "Set 2 lọ" thành **variant đóng gói** | -45 |
| `Kem Đánh Răng Giúp Trắng Răng, Giảm Ố, Loại Bỏ Mùi Hôi Median Dental IQ 93% Toothpaste 120g- Trắng (hương trà xanh)` (115) | `Kem đánh răng Median Dental IQ 93% — 120g (Trà xanh)` (52) | -63 |
| `( Hôp giấy) Viên uống bổ não Samsung Gum Jee Hwan An Cung  hộp  60 viên` (71) | `Viên bổ não Samsung An Cung — Hộp 60 viên` (43) → "Hộp giấy" loại nếu không phải đặc điểm phân biệt | -28 |
| `Áo khoác nữ Spao chần bông cổ cao SPJAE 4TG92` (x2) | SP1: `Áo khoác chần bông cổ cao SPAO SPJAE-4TG92` (giữ unique), SP2: kiểm tra → có thể **MERGE** → variant theo size/color | exact-dup → loại |
| `( Red _ Unbox) Son Lì Ohui The First Gentinure Lipstick 3.8g Màu Red` | `Son lì Ohui The First Geniture — 3.8g` + variants `[Red Fullbox, Red Unbox]` | bỏ duplication |

### 3.4 Quy tắc cụ thể (rule book)

1. **BỎ tag đóng gói khỏi tên SP, đẩy thành VARIANT** (`variant.name`):
   - `( Fullbox )`, `( Unbox )`, `( Tách set )`, `( Lẻ 1 …)`, `Sample`, `Mini`, `Tặng kèm …` → variant.
2. **BỎ kênh bán** khỏi tên: `Shopee`, `Shopee _`, `Shopee Mall`.
3. **CHUẨN HOÁ khoảng trắng**: bỏ multi-space, bỏ space trước dấu `(`, sau dấu `(`.
4. **CHUẨN HOÁ dấu phân tách**: thay `_` bằng ` — ` (em-dash) hoặc `,`. Ví dụ: `Tone 21 _ Phấn nước` → `Phấn nước (Tone 21)`.
5. **CHUẨN HOÁ thứ tự từ**: `[Loại] [Brand] [Dòng] [Đặc điểm] — [Dung tích]`. KHÔNG lặp lại brand 2 lần.
6. **CHUẨN HOÁ chữ hoa/thường**: tên thường viết Title Case Tiếng Việt: `Kem chống nắng` (không phải `KEM CHỐNG NẮNG`), brand giữ nguyên hoa thường gốc (`OHUI`, `Whoo`, `su:m37`, `d'Alba`).
7. **CHUẨN HOÁ số đo**: `35ml` (không phải `35 ml`, `35ML`); ` — ` trước dung tích.
8. **MERGE SP trùng tên exact** (6 nhóm) sau khi confirm cùng SKU/cùng đặc điểm. Nếu khác đặc điểm thật → thêm differentiator vào tên.
9. **Sản phẩm tên ≤ 5 ký tự không có brand** (như `ALI`, `EVA`, `ROMEO`): nếu là model kính Rieti, đổi thành `Kính Rieti — ALI`, `Kính Rieti — ROMEO` để có context.
10. **Sản phẩm "code-only" như SPAO `SPTJD25G51`**: thêm tả ngắn lên đầu: `Quần jeans nữ ống rộng SPAO — SPTJD25G51`.

### 3.5 Cách thực thi (Migration plan)

**Phase 0 — Backup:**
```sql
CREATE TABLE _backup_categories_260505 AS SELECT * FROM categories;
CREATE TABLE _backup_products_260505 AS SELECT * FROM products;
CREATE TABLE _backup_product_variants_260505 AS SELECT * FROM product_variants;
```

**Phase 1 — Insert cây danh mục mới (read-only side, chưa attach SP):**
- Insert 6 root mới (`my-pham`, `body-hair-care`, `health-food`, `fashion`, `lifestyle`) bên cạnh `kinh-mat` đang có.
- Insert sub-categories từng cấp.

**Phase 2 — Restructure nhánh Kính:**
- MERGE: RT7 + RT8 + Latest Collection → "Rieti — Bộ sưu tập mới" (UPDATE products, sau đó DELETE 3 sub cũ).
- DELETE "Special" sau khi move SP.
- RENAME 6 sub còn lại (drop tiền tố `RT[n] —`).

**Phase 3 — Tự động gán category cho 1.321 SP `NULL`:**
- Dùng SQL `UPDATE … WHERE name ILIKE …` theo bộ rule ở §1.3.
- Sau pass tự động sẽ còn ~347 SP UNKNOWN cần **review tay** (chia batch ~50/lần cho admin).

**Phase 4 — Rename SP (batch script):**
- Tạo bảng tạm `product_renames(id, old_name, new_name, status)`.
- Script Node.js / SQL apply rule §3.4 (regex strip `Fullbox`, `Unbox`, `Shopee`, multi-space → space, `_` → ` — `).
- Diff/preview trước khi commit. Lưu old name vào `description` hoặc 1 cột `legacy_name` tạm.

**Phase 5 — Merge Sample/Tách-set/Fullbox vào Variants:**
- Đây là phase **tốn công nhất** vì cần map SP gốc với SP-sample. Strategy: match qua keyword brand+model+số ml, manual confirm.
- Có thể cần thêm cột `product_variants.packaging` (`fullbox`, `unbox`, `sample`, `mini`, `set`) — nhưng schema hiện tại đã có `variant.name` có thể chứa được.

**Phase 6 — Slug regen:**
- Script chạy `slugify(new_name)` cập nhật `products.slug`. Cẩn thận với SEO: nếu có public traffic, cần redirect slug cũ → mới.

### 3.6 Tác động & Risk

| Tác động | Mức | Ghi chú |
|----------|-----|----|
| Lịch sử đơn hàng | **An toàn** | `order_items` đã snapshot `product_name`, `variant_name`, `sku` — đổi tên KHÔNG ảnh hưởng đơn cũ. |
| URL/SEO front-end | **Trung bình** | Đổi slug cần redirect 301 nếu shop đã chạy public. |
| Code/UI | **Thấp** | Schema không đổi, chỉ thay data. Component nav phụ thuộc `show_in_nav`, `display_order` — set lại sau insert sub mới. |
| Search/filter | **Tốt lên** | Categorize đầy đủ → filter theo nhóm hoạt động đúng. |
| Inventory/SKU | **An toàn** | `variant.sku` không đổi (unique). |

---

## 4. Đề xuất bước tiếp theo

1. **User confirm** cấu trúc category mới (§3.1) + các quy tắc rename (§3.4) trước khi viết migration.
2. Sau confirm: tạo plan `260505-{hh}{mm}-categories-products-restructure/` với phases 1–6, mỗi phase 1 file `phase-XX-*.md`.
3. Phase 1 (insert tree mới) + Phase 2 (restructure Kính) có thể chạy ngay, **risk thấp**.
4. Phase 4 (rename) làm trên 1 nhánh DB staging trước, dump `before/after` cho user duyệt batch.
5. Phase 5 (merge variants) cần admin/user trợ giúp confirm thủ công (không AI tự động được).

---

## 5. Các điểm cần user quyết định

1. **Slug `kinh-mat` (root)**: giữ tiếng Việt hay đổi `eyewear`? (đụng SEO nếu shop đã public).
2. **Cây "Mẹ & Bé"**: có muốn tạo riêng hay tạm gộp vào "Sức khoẻ" + "Thời trang trẻ em"?
3. **Cây "Quần áo Nam/Nữ"**: phân theo giới hay theo loại (áo/quần/váy)? Hiện data có lẫn lộn (ví dụ `[Nữ] Quần short Spao`).
4. **Có cho phép SP cùng lúc thuộc nhiều category** không? (hiện schema 1-1: `products.category_id`. Nếu cần multi-category, phải thêm bảng `product_categories(product_id, category_id)`.)
5. **Strategy cho 347 SP UNKNOWN**: chấp nhận để `category_id = NULL` tạm, hay tạo "Khác / Chưa phân loại"?
6. **Phase 5 (merge sample/fullbox vào variants)**: có muốn làm ngay hay để pha sau (tốn thời gian, cần manual review)?
7. **Lịch áp dụng**: có public site đang chạy production không? Có user đang xem URL/slug cũ không?

---

## 6. Tham chiếu

- Schema: `packages/database/src/schema/categories.ts`, `packages/database/src/schema/products.ts`
- Snapshot trong order: `order_items.product_name`, `order_items.variant_name`, `order_items.sku` — không phụ thuộc rename.
- Tổng hợp:
  - 1.396 SP / 75 categorized / 1.321 NULL
  - 11 categories, 6 trùng-tên-exact, 2 trùng-tên-category, 138 multi-space, 33 dấu `(` đầu, 31 sample, 31 tách set, 14 fullbox, 17 unbox, 3 shopee, 63 underscore
  - Avg name len 39, max 132
