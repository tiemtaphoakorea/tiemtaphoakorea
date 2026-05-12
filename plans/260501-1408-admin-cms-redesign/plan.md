# Admin CMS Redesign — Tiệm Korea Design System

Source: `https://api.anthropic.com/v1/design/h/1IYKhaWFr-JPG6sCwJTwkg` (admin/Admin CMS.html, 1670 LOC).
Brand: Tiệm Tạp Hóa Korea, indigo + amber + Be Vietnam Pro.

## Strategy

Port the design as a self-contained SPA mounted at the admin dashboard root.
Internal nav (state-based) mirrors the prototype exactly (13 pages).
Existing API services & auth layer remain untouched.

## Route mapping (prototype → existing)

| Prototype id | Label | Existing route |
|---|---|---|
| dashboard | Dashboard | `/` |
| products | Sản phẩm | `/products` |
| categories | Danh mục | `/categories` |
| orders | Đơn hàng | `/orders` |
| debts | Công nợ | `/debts` |
| warehouse | Quản lý kho | `/inventory` |
| suppliers | Nhà cung cấp | `/suppliers` |
| customers | Khách hàng | `/customers` |
| staff | Nhân sự | `/users` |
| messages | Tin nhắn | `/chat` |
| expenses | Chi phí | `/expenses` |
| reports | Báo cáo | `/analytics` |
| settings | Cài đặt | `/settings` |

The new SPA uses internal state navigation; existing sub-routes stay accessible
for deep-link compatibility but are not surfaced in the new nav.

## File layout

```
app/(dashboard)/admin-cms/
  admin-cms.css           # design CSS (verbatim, scoped to .admin-cms-root)
  icons.tsx               # 24 SVG icons used by sidebar/headers
  data.ts                 # mock arrays (products, orders, suppliers, etc.)
  helpers.tsx             # fmt, Bdg, BarChart, Countdown
  sidebar.tsx             # sectioned nav + collapse
  topbar.tsx              # breadcrumb, search, bell, avatar
  drawers.tsx             # product + order drawers
  app.tsx                 # SPA root (state nav)
  pages/
    dashboard.tsx
    products.tsx
    categories.tsx
    orders.tsx
    debts.tsx
    warehouse.tsx
    suppliers.tsx
    customers.tsx
    staff.tsx
    messages.tsx
    expenses.tsx
    reports.tsx
    settings.tsx
```

## Replacements

- `app/(dashboard)/layout.tsx` → minimal auth + QueryClient wrapper (no chrome).
- `app/(dashboard)/page.tsx` → renders `<AdminCMSApp />`.

## Steps

1. Port design CSS verbatim.
2. Port icons + helpers + data.
3. Sidebar + topbar + app shell.
4. 13 page components.
5. 2 drawers.
6. Wire into dashboard route, simplify layout.
7. Typecheck.
