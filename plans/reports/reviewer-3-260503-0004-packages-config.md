# Review packages/* + Cross-cutting Config — Hardcode & Mock Audit

**Reviewer:** reviewer-packages
**Phạm vi:** packages/database, packages/shared, packages/ui, packages/eslint-config, packages/typescript-config, scripts/, biome.json, knip.json, turbo.json, docker-compose.yml, .env.example, package.json (root + workspace).

## Tóm tắt

- **6 CRITICAL** (security: predictable RNG cho password, weak default secret, hardcoded admin password trong script chạy với DATABASE_URL prod).
- **5 IMPORTANT** (mock data còn export trên package surface, seed file auto-run on import, scripts e2e dùng password yếu, env trùng lặp / typo).
- **5 MODERATE** (dead-code constants, unused base URL fallback, collision-prone Math.random cho filename, sample data trong seed-rieti/seed-e2e nếu chạy nhầm prod).

---

## CRITICAL

### C1. `Math.random()` sinh password user (predictable RNG)
File: `packages/database/src/services/user.server.ts:75` và `:185`

```ts
const password = data.password || Math.random().toString(36).slice(-DEFAULT_PASSWORD_LENGTH); // createUser
const newPassword = Math.random().toString(36).slice(-DEFAULT_PASSWORD_LENGTH); // resetUserPassword
```

`Math.random()` không cryptographically secure → password có thể đoán được nếu attacker biết khoảng thời gian. Áp dụng cho cả `createUser` (admin tạo nhân viên) lẫn `resetUserPassword` (reset admin/manager). Phải dùng `crypto.randomBytes` hoặc `crypto.randomUUID()` rồi base64/hex. `DEFAULT_PASSWORD_LENGTH = 8` cũng quá ngắn.

### C2. `SESSION_SECRET=default_secret` trong `.env.example`
File: `.env.example:6`

```
SESSION_SECRET=default_secret
```

`packages/database/src/lib/security.ts:5-8` chỉ check `if (!SESSION_SECRET)`. Chuỗi `"default_secret"` là truthy → guard pass → JWT HS256 ký bằng key public-known. Dev mới nào `cp .env.example .env` không sửa → app boot với key attacker-known → có thể forge admin session. Phải để trống (empty string) hoặc bỏ giá trị mặc định để guard fail.

### C3. `scripts/create-admin.ts` hardcode `password = "password123"`
File: `scripts/create-admin.ts:14-16`

```ts
const username = "admin";
const password = "password123";
const fullName = "Admin User";
```

Không có env override. Chạy thẳng với `DATABASE_URL` (kể cả prod) → upsert/update password admin = `password123`. Khác `seed-admin.ts` vì không có cơ chế `process.env.ADMIN_PASSWORD`. Nếu CI/staging vô tình chạy script → admin prod bị reset password yếu.

### C4. `scripts/seed-admin.ts` — guard production password unreachable
File: `scripts/seed-admin.ts:13-20`

```ts
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password123";
...
if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD env variable is required for production seed");
}
```

Sau `|| "password123"`, `ADMIN_PASSWORD` luôn truthy → throw dead. Nếu deploy quên set env, script âm thầm seed prod admin với `password123`. Comment ghi "production seed" → ý đồ rõ ràng nhưng implementation ngược lại. Phải bỏ default `|| "password123"` và để guard fail.

### C5. Root `db:seed:e2e` script seed admin với password mặc định
File: `scripts/seed-e2e.ts:16` + `package.json:14`

```ts
const DEFAULT_PASSWORD = "password123";
// USERS array seeds admin (line 21) with this password
```

Script được expose qua `pnpm db:seed:e2e` ở `package.json:14`. Chỉ cần `DATABASE_URL` (không guard env như `NODE_ENV !== production`). Foot-gun: nhân viên gõ nhầm DB URL → seed prod thành `admin/password123`. Tên "e2e" giúp giảm risk nhưng không đủ.

### C6. `scripts/update-admin-password.ts` log password ra stdout
File: `scripts/update-admin-password.ts:42-45`

```ts
console.log("Password updated successfully in Database!");
console.log(`Identifier: ${identifier}`);
console.log(`New Password: ${newPassword}`);
```

Password plaintext xuất hiện trong terminal log + history. CI/CD log chứa secret. Chạy local thì rủi ro thấp; trên prod-jumpbox/CI là leak rõ ràng. Tương tự `create-admin.ts:54` cũng log password.

---

## IMPORTANT

### I1. `packages/shared/src/analytics.ts` export mock revenue/category/products
File: `packages/shared/src/analytics.ts:1-29`

```ts
export const K_REVENUE_DATA = [{ month: "Tháng 1", revenue: 45000000, orders: 120 }, ...];
export const K_CATEGORY_DATA = [{ category: "Chăm sóc da", sales: 45000, ... }];
export const K_TOP_PRODUCTS = [{ name: "Toner hoa cúc Anua", sales: 850, ... }];
```

Không có consumer (`grep K_REVENUE_DATA` chỉ hit định nghĩa). Tuy nhiên `packages/shared/package.json:16` expose subpath `"./analytics": "./src/analytics.ts"` → import-able từ bất kỳ app nào. Path analytics thật (`packages/database/src/services/analytics.server.ts`) đã wired vào DB — đây là dead mock surface còn sót. Xóa file + bỏ subpath export.

### I2. `homepage-collections.seed.ts` auto-run on import
File: `packages/database/src/seed/homepage-collections.seed.ts:59-64`

```ts
seedHomepageCollections()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
```

Top-level call, không có guard kiểu `if (import.meta.url === ...)`. Hiện chưa có consumer nhưng file nằm trong package — chỉ cần `import` (qua barrel hoặc tool quét) là DB write + `process.exit(0)` chạy. Phải bọc trong guard hoặc move sang `scripts/`.

### I3. `ANALYTICS_GROWTH_RANDOM_*` constants chưa dùng
File: `packages/shared/src/constants.ts:139-141`

```ts
export const ANALYTICS_DEFAULT_CONVERSION_RATE = 3.45;
export const ANALYTICS_GROWTH_RANDOM_RANGE = 20;
export const ANALYTICS_GROWTH_RANDOM_OFFSET = -5;
```

Zero consumer trong `packages/`, `apps/admin/`, `apps/main/`. Naming "RANDOM_RANGE/OFFSET" cho thấy ý đồ trước đây fake growth numbers. `analytics.server.ts:115` đã set `conversionRate: null`. Constants dead — xóa.

### I4. `STOREFRONT_BASE_URL=h` typo trong `.env.example`
File: `.env.example:7`

```
STOREFRONT_BASE_URL=h
```

Giá trị `h` rõ ràng là gõ nhầm. Dev copy file sẽ nhận URL không hợp lệ. Phải để trống.

### I5. `ADMIN_BASE_URL` / `STOREFRONT_BASE_URL` constants không có consumer
File: `packages/shared/src/constants.ts:1-2`

```ts
export const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || "http://admin.localhost:3001";
export const STOREFRONT_BASE_URL = process.env.STOREFRONT_BASE_URL || "http://localhost:3000";
```

`grep ADMIN_BASE_URL\|STOREFRONT_BASE_URL` chỉ hit định nghĩa + `.env.example`. Hai env var này còn liệt kê trong `turbo.json:globalEnv` nhưng không file nào dùng → dead config bề mặt. Loại bỏ hoặc xác nhận lại có middleware/redirect chưa merge cần dùng.

---

## MODERATE

### M1. `CUSTOMER_EMAIL_DOMAIN = "shop.internal"` không có consumer
File: `packages/shared/src/constants.ts:109`

```ts
export const CUSTOMER_EMAIL_DOMAIN = "shop.internal";
```

`grep` chỉ hit định nghĩa + 1 chỗ hiển thị raw string `@shop.internal` ở `apps/admin/components/admin/customer-detail/customer-profile-header.tsx:66`. Nếu consumer ấy chính là chỗ phải dùng constant này → dead constant. Nếu không, xóa.

### M2. `Math.random()` cho filename / customer code suffix (collision risk)
Files:
- `packages/database/src/services/storage.server.ts:12` — `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
- `packages/database/src/services/customer.server.ts:135` — random 3-digit suffix khi customer code đụng độ
- `packages/database/src/lib/db-locking.ts:123,144` — order number `RANDOM(0..0xffffff)` (6 hex)
- `scripts/migrate-images-to-supabase.ts:34` — same pattern

Không phải security (đã có `crypto.randomUUID()` trong `chat.server.ts:442` — pattern đúng). Risk: collision dưới tải cao, đặc biệt 6-hex order number = 16M space → birthday paradox ~4K orders/ngày là đủ. Đổi sang `crypto.randomUUID()` hoặc DB sequence.

### M3. `seed-rieti.ts` / `seed-e2e.ts` chứa product data mẫu (`Premium Coffee`, `Robusta Coffee`...)
Files:
- `scripts/seed-e2e.ts:153-266` — 16 sản phẩm mock kèm Unsplash image URLs
- `scripts/seed-rieti.ts` — Rieti eyewear products

Nếu chỉ chạy local/E2E thì OK. Nhưng `db:seed:e2e` ở `package.json:14` chỉ guard `DATABASE_URL` → chạy nhầm prod sẽ insert 16 products + nhiều variants giả. Bổ sung guard `NODE_ENV !== production` hoặc bắt buộc `--confirm` flag.

### M4. `seed-e2e.ts` chứa 22 Unsplash URLs hardcoded
File: `scripts/seed-e2e.ts:462-502`

```ts
"https://images.unsplash.com/photo-1509042239860-..."
```

Không phải prod URL nguy hiểm, nhưng phụ thuộc external CDN khi seed → flaky nếu Unsplash đổi photo. Move sang asset bundle hoặc tài liệu rõ ràng.

### M5. `crawl-rieti.ts` hardcode external URL `https://en.rieti.co.kr`
File: `scripts/crawl-rieti.ts:10`

```ts
const BASE_URL = "https://en.rieti.co.kr";
```

Script utility scrape product listing — chấp nhận được nếu mục đích là crawl 1 nguồn cố định. Tuy nhiên nên đưa vào tham số CLI hoặc env để reuse.

---

## Findings không phải issue (đã verify, để đối chiếu)

- `docker-compose.yml:8` `POSTGRES_PASSWORD: password` — dev-only, container local. Skip theo hướng dẫn task.
- `crypto.randomUUID()` ở `chat.server.ts:442` — pattern đúng, không flag.
- Supabase clients (`packages/database/src/lib/supabase/{server,client,admin}.ts`) — đều validate env, throw nếu thiếu, không có hardcode key. Sạch.
- `packages/database/src/db.ts` — DATABASE_URL không có default, lazy proxy throw at query time. Sạch.
- `packages/database/drizzle.config.ts` — load .env qua dotenv, không hardcode connection string. Sạch.
- ESLint configs (`packages/eslint-config/{base,next,react-internal}.js`) — không hardcode URL/secret. Sạch.
- TS configs / biome.json / knip.json / turbo.json — config thuần, không secret.
- `packages/shared/src/api-endpoints.ts`, `routes.ts`, `pagination.ts`, `http-status.ts`, `utils.ts`, `api-client.ts` — không có hardcode URL/credential.
- `packages/database/src/services/*.server.ts` — không thấy stub/mock/`Promise.resolve(stub)`. Tất cả đều chạy DB query thật.

---

## Các câu hỏi chưa giải đáp

1. `ADMIN_BASE_URL` + `STOREFRONT_BASE_URL` có phải đang dành cho middleware/cross-domain redirect chưa merge? Nếu không nên xóa luôn cả entries trong `turbo.json:globalEnv`.
2. `homepage-collections.seed.ts` thiết kế chạy như thế nào? `package.json` không có script `db:seed:homepage` → file hiện chỉ có thể chạy thủ công bằng `tsx`. Có nên consolidate vào `scripts/`?
3. `seed-e2e.ts` có thuộc CI/E2E pipeline không? Nếu có, pipeline có set `DATABASE_URL` riêng (không phải prod) bắt buộc?
4. `K_REVENUE_DATA`/`K_CATEGORY_DATA`/`K_TOP_PRODUCTS` còn dùng để demo design system / Storybook không? Nếu không, drop hẳn.
5. `update-admin-password.ts` + `create-admin.ts` log plaintext password — có chính sách CI/runbook hiện tại không gọi 2 script này tự động?
