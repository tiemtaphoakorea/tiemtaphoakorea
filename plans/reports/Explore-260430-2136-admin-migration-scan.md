# Admin App Structure Scan: Next.js → Vite + React Migration

**Scope:** `/Users/kien.ha/Code/auth_shop_platform/apps/admin`  
**Date:** 2026-04-30  
**Focus:** Complete inventory for Next.js-specific features & server-side patterns  

---

## 1. PAGE ROUTES

### (dashboard) Routes — 25 pages
All marked with `"use client"` except layouts.

| Path | File | Purpose | Dynamic |
|------|------|---------|---------|
| `/` | `page.tsx` | Dashboard home; KPIs, recent orders, debt summary | No |
| `/analytics` | `page.tsx` | Analytics hub (nav to sub-routes) | No |
| `/analytics/overview` | `page.tsx` | Overview charts & stats | No |
| `/analytics/products` | `page.tsx` | Product-level analytics | No |
| `/analytics/inventory` | `page.tsx` | Inventory movements & alerts | No |
| `/analytics/finance` | `page.tsx` | Finance dashboard | No |
| `/analytics/finance/detail` | `page.tsx` | Daily finance detail with drawer | No |
| `/categories` | `page.tsx` | Category management (CRUD) | No |
| `/chat` | `page.tsx` | Real-time chat with customers (Supabase realtime) | No |
| `/customers` | `page.tsx` | Customer table, search, pagination | No |
| `/customers/[id]` | `page.tsx` | Customer detail, edit, financial history | ✓ (id) |
| `/debts` | `page.tsx` | Debt ledger, bulk payment | No |
| `/debts/[customerId]` | `page.tsx` | Customer debt detail | ✓ (customerId) |
| `/expenses` | `page.tsx` | Expense CRUD | No |
| `/orders` | `page.tsx` | Order table, search, filter | No |
| `/orders/new` | `page.tsx` | Create order wizard | No |
| `/orders/[id]` | `page.tsx` | Order detail, status, payments, stock-out | ✓ (id) |
| `/products` | `page.tsx` | Product table, search | No |
| `/products/new` | `page.tsx` | Create product | No |
| `/products/[id]/edit` | `page.tsx` | Edit product & variants | ✓ (id) |
| `/settings` | `page.tsx` | Admin settings (customer tier) | No |
| `/supplier-orders` | `page.tsx` | Supplier order table | No |
| `/suppliers` | `page.tsx` | Supplier CRUD | No |
| `/users` | `page.tsx` | User management (staff) | No |

### (public) Routes — 1 page

| Path | File | Purpose | Dynamic |
|------|------|---------|---------|
| `/login` | `page.tsx` | Auth form; `useRouter().push("/")` on success | No |

---

## 2. API ROUTES (`/app/api/admin/*`)

**Totals:** 72 route handlers  
**Methods:** GET (31), POST (19), PUT (7), PATCH (4), DELETE (10), POST-no-args (1)  
**Pattern:** All use `NextRequest`, `NextResponse`, auth via `requireApiUser()` from `lib/api-auth.ts`

### Analytics
- `GET /api/admin/analytics` — Overview stats
- `GET /api/admin/analytics/stock-alerts` — Low-stock warnings

### Banners (Marketing)
- `GET /api/admin/banners` — List all
- `POST /api/admin/banners` — Create
- `GET /api/admin/banners/[id]` — Fetch
- `PUT /api/admin/banners/[id]` — Update
- `DELETE /api/admin/banners/[id]` — Delete
- `POST /api/admin/banners/reorder` — Reorder

### Categories
- `GET /api/admin/categories` — List all
- `POST /api/admin/categories` — Create
- `GET /api/admin/categories/[id]` — Fetch
- `PUT /api/admin/categories/[id]` — Update
- `DELETE /api/admin/categories/[id]` — Delete

### Chat (Real-time)
- `POST /api/admin/chat` — Send message (integrates with OpenAI Agents + Supabase)

### Customers
- `GET /api/admin/customers` — List (search, pagination)
- `POST /api/admin/customers` — Create
- `GET /api/admin/customers/[id]` — Fetch detail
- `PUT /api/admin/customers/[id]` — Update profile
- `DELETE /api/admin/customers/[id]` — Delete
- `PATCH /api/admin/customers/[id]/status` — Update tier/status
- `GET /api/admin/customers/stats` — Stats (count, balance)

### Debts
- `GET /api/admin/debts` — List debts (search, filter)
- `POST /api/admin/debts` — Create debt record
- `GET /api/admin/debts/[customerId]` — Fetch customer debts
- `PUT /api/admin/debts/[customerId]` — Update debt
- `DELETE /api/admin/debts/[customerId]` — Delete debt record
- `GET /api/admin/debts/summary` — Total debt summary

### Expenses
- `GET /api/admin/expenses` — List
- `POST /api/admin/expenses` — Create
- `GET /api/admin/expenses/[id]` — Fetch
- `PUT /api/admin/expenses/[id]` — Update
- `DELETE /api/admin/expenses/[id]` — Delete

### Finance
- `GET /api/admin/finance` — Finance overview
- `GET /api/admin/finance/daily` — Daily summary
- `GET /api/admin/finance/daily/[date]` — Detail for specific date

### Inventory
- `GET /api/admin/inventory/movements` — Movement history (pagination)
- `POST /api/admin/inventory/movements/adjust` — Manual adjustment
- `GET /api/admin/inventory/movements/daily-summary` — Daily summary

### Auth
- `POST /api/admin/login` — Login (sets session cookie)
- `POST /api/admin/logout` — Logout

### Orders
- `GET /api/admin/orders` — List (search, status filter)
- `POST /api/admin/orders` — Create
- `GET /api/admin/orders/[id]` — Fetch detail
- `PUT /api/admin/orders/[id]` — Update order
- `DELETE /api/admin/orders/[id]` — Delete
- `POST /api/admin/orders/[id]/cancel` — Cancel order
- `POST /api/admin/orders/[id]/complete` — Mark complete
- `POST /api/admin/orders/[id]/stock-out` — Record stock movement
- `GET /api/admin/orders/[id]/payments` — Fetch payment history
- `POST /api/admin/orders/[id]/payments` — Record payment
- `GET /api/admin/orders/stats` — Orders count, revenue

### Products
- `GET /api/admin/products` — List (search, pagination)
- `POST /api/admin/products` — Create
- `GET /api/admin/products/[id]` — Fetch detail
- `PUT /api/admin/products/[id]` — Update
- `DELETE /api/admin/products/[id]` — Delete
- `GET /api/admin/products/[id]/variants` — Fetch variants
- `POST /api/admin/products/[id]/variants` — Create variant
- `GET /api/admin/products/variants/[variantId]/cost-history` — Variant cost tracking

### Profile
- `GET /api/admin/profile` — Current user profile (auth check)

### Settings
- `GET /api/admin/settings/customer-tier` — Tier configuration
- `POST /api/admin/settings/customer-tier` — Update tiers

### Stats
- `GET /api/admin/stats` — Dashboard KPIs (revenue, orders, customers, debt)

### Suppliers
- `GET /api/admin/suppliers` — List
- `POST /api/admin/suppliers` — Create
- `GET /api/admin/suppliers/[id]` — Fetch
- `PUT /api/admin/suppliers/[id]` — Update
- `DELETE /api/admin/suppliers/[id]` — Delete
- `GET /api/admin/suppliers/[id]/stats` — Supplier performance

### Supplier Orders
- `GET /api/admin/supplier-orders` — List
- `POST /api/admin/supplier-orders` — Create
- `GET /api/admin/supplier-orders/[id]` — Fetch detail
- `PUT /api/admin/supplier-orders/[id]` — Update
- `DELETE /api/admin/supplier-orders/[id]` — Delete

### Users (Staff)
- `GET /api/admin/users` — List staff
- `POST /api/admin/users` — Create user
- `GET /api/admin/users/[id]` — Fetch user
- `PUT /api/admin/users/[id]` — Update user
- `DELETE /api/admin/users/[id]` — Delete user
- `POST /api/admin/users/[id]/reset-password` — Reset password

---

## 3. SERVER-SIDE FEATURES USED

### 'use server' Directives
**Count:** 0 occurrences  
→ App uses **only client-side components**; server logic is **exclusively in API routes**

### 'use client' Directives
**Count:** 25 in `/app` (all 25 dashboard/public pages)  
**Server components:** 2 (root `layout.tsx`, `(dashboard)/layout.tsx` — but layout.tsx is wrapped in `"use client"` boundary via `AdminLayoutContent`)

### next/navigation Usage
**Imports found:** 51 total
- `useRouter()` — 22 occurrences (navigation, redirect on auth fail, push after login)
- `usePathname()` — 3 (breadcrumb generation in layout)
- `useParams()` — 3 (extract dynamic route params: `[id]`, `[customerId]`)
- `useSearchParams()` — 2 (query filters)
- `redirect()` — 1 (in `(dashboard)/layout.tsx` on auth failure, line 53)

### next/link
**Count:** 32 imports
Used for:
- Navigation links in breadcrumbs, sidebar, buttons
- Page-to-page transitions within dashboard

### next/image
**Count:** 9 imports
Used in:
- Customer avatars
- Product images
- Banner images (fetched from backend or Supabase Storage)

### next/font
**Count:** 2 fonts in root `layout.tsx` (line 2)
- `Cormorant_Garamond` (display font for headings)
- `DM_Sans` (body font)
Both applied as CSS variables: `--font-display`, `--font-sans`

### next/headers
**Count:** 0 direct imports in `/app`  
(Auth uses cookies from `@workspace/database/lib/auth`, which likely wraps `next/headers` internally)

### Route Handlers (NextRequest, NextResponse)
**Count:** 72 API routes use both  
Example pattern (from `/api/admin/customers/route.ts`):
```ts
export async function GET(request: Request) {
  const user = await getInternalUser(request);  // extracts cookie
  if (!user) return NextResponse.json({error: "Unauthorized"}, {status: 401});
  // ... query db, return NextResponse.json()
}
```

### Revalidation (revalidatePath, revalidateTag, unstable_cache)
**Count:** 0 occurrences  
(No ISR/revalidation — all pages are client-rendered; data fetched via React Query on mount/interaction)

### notFound()
**Count:** 0 occurrences

### middleware.ts
**Count:** 0  
No middleware file present. Auth is checked in route handlers only.

---

## 4. LAYOUTS

### Root Layout
**File:** `/app/layout.tsx`  
**Features:**
- Imports fonts from `next/font/google`
- Wraps app in `<TooltipProvider>` (shadcn) and `<Toaster />` (sonner notifications)
- No auth logic here; no dynamic rendering

### Dashboard Layout
**File:** `/app/(dashboard)/layout.tsx`  
**Features:**
- `"use client"` directive
- `<QueryClientProvider>` wraps `AdminLayoutContent` for React Query
- `AdminLayoutContent` component:
  - Fetches user profile via `useQuery` → `adminClient.getProfile()`
  - Calls `redirect("/login")` if auth fails (line 53)
  - Renders `<AdminSidebar>` with user data
  - Generates breadcrumbs from `pathname` + `ADMIN_ROUTE_NAMES` mapping
  - Shows loading spinner in Suspense fallback
- No `(public)` layout — login page uses root layout only

---

## 5. AUTH FLOW

### Login Flow
1. User navigates to `/login` (public route, no auth check)
2. Form submission → `adminClient.login(credentials)`
3. Client sends POST to `/api/admin/login` with username/password
4. API route validates credentials against database
5. Sets `session` cookie (HTTP-only)
6. Client calls `router.push("/")` to redirect
7. `(dashboard)/layout.tsx` fetches profile via `useQuery` → `/api/admin/profile`
8. If profile fetch fails, calls `redirect("/login")`

### Session Management
- **Cookie-based:** HTTP-only session cookie set by `POST /api/admin/login`
- **Auth check:** All API routes call `getInternalUser(request)` (from `@workspace/database/lib/auth`)
  - Extracts and validates session cookie
  - Returns user object or null
- **Client-side:** Profile fetched once in dashboard layout, cached via React Query (`staleTime: 5 min`)

### Logout
- POST `/api/admin/logout` — clears session cookie
- No explicit client-side redirect; user navigates manually or page refreshes

---

## 6. DIRECT DB/DRIZZLE ACCESS FROM PAGES

### Client Pages
**Count:** 0  
✓ All pages use `"use client"` and fetch via `/api/admin/*` routes exclusively

### API Routes  
**All 72 routes:** Import from `@workspace/database/services/` (not raw Drizzle ORM)
Examples:
- `/api/admin/customers/route.ts` imports `getCustomers`, `createCustomer` from `@workspace/database/services/customer.server`
- `/api/admin/orders/route.ts` imports `getOrders`, `createOrder`, etc.

### Server Functions in @workspace/database
These are wrapper functions that handle Drizzle ORM queries internally; admin app does **not** directly touch Drizzle.

---

## 7. SHARED PACKAGE USAGE

### @workspace/database
**Imports across admin app:**
- `getInternalUser()` from `@workspace/database/lib/auth` — auth verification in API routes
- `createClient()` from `@workspace/database/lib/supabase/client` — Supabase realtime in chat page
- Service functions: `getCustomers()`, `createCustomer()`, `getOrders()`, etc. from `@workspace/database/services/*`
- Type imports: `CustomerDetail`, `AdminProfile`, `Order`, `ChatMessage`, etc. from `@workspace/database/types/admin` and `/api`

### @workspace/shared
**Imports across admin app (100+ usages):**
- `API_ENDPOINTS` — endpoint paths (used by `adminClient`)
- `PUBLIC_ROUTES`, `ADMIN_ROUTES` — route constants
- `ADMIN_ROUTE_NAMES` — breadcrumb name mappings
- `loginSchema`, `LoginFormValues` — Zod schema & types
- `formatCurrency()`, `formatDate()` — utilities
- `HTTP_STATUS` — HTTP status constants
- `ROLE` — user role enum
- `ADMIN_TITLE`, `ADMIN_STATS_SECTION`, `CHAT_MESSAGE_TYPE` — constants
- `getPaginationParams()` — pagination helper
- `axios` — HTTP client wrapper

### @workspace/ui
**Imports across admin app (50+ component imports):**
- Button, Input, Card, Table, Dialog, Dropdown, Sheet, Breadcrumb, Badge, etc.
- Sidebar, Separator, ScrollArea, Alert, Tooltip
- ErrorBoundary, Toaster (from sonner), TooltipProvider
- All from `@workspace/ui/components/*`
- Utilities: `cn()` from `@workspace/ui/lib/utils`, `globals.css` from `@workspace/ui/styles`

---

## 8. COMPONENT STRUCTURE

### Client Components
**Total:** ~80 components under `/components/admin/` and `/components/layout/`

**Patterns:**
- Data fetching via React Query (`useQuery`, `useMutation`)
- State management via `useState`, `useCallback`, `useEffect`
- API calls via `adminClient.*` service methods
- Tables use `@tanstack/react-table` (data table library)
- Forms use React Hook Form + Zod validation
- Real-time updates: Chat page uses Supabase realtime subscription

**Key Component Folders:**
- `admin/analytics/` — charts, stats (Recharts)
- `admin/chat-room/` — message list, input, real-time
- `admin/customer-detail/` — customer profile, history, security
- `admin/customers/` — table, add/edit sheets, credential dialog
- `admin/dashboard/` — KPIs, recent orders, debt summary
- `admin/orders/` — table, detail, create wizard, payment dialog
- `admin/products/` — table, form, category selector, variants
- `admin/suppliers/` — table, detail sheets, stats
- `admin/supplier-orders/` — table, status dialog, inventory movements
- `layout/` — sidebar, breadcrumb, chat notification bell

### Hooks
- React Query: `useQuery`, `useMutation`, `useQueryClient`
- Next.js: `useRouter`, `usePathname`, `useParams`, `useSearchParams`
- React: `useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`
- Third-party: `useForm`, `useDebounce`, `useLocalStorage`

---

## 9. EXTERNAL DEPENDENCIES (package.json)

### Core Framework
- `next@16.1.5` ← **primary dependency for migration**
- `react@19.2.4`, `react-dom@19.2.4`

### Data & State
- `@tanstack/react-query@5.90.19` — server state (fetch, cache, sync)
- `@tanstack/react-table@8.21.3` — headless table rendering
- `drizzle-orm@0.45.1` — ORM (imported only in `@workspace/database`, not directly)

### API & Auth
- `axios@1.13.4` — HTTP client (wrapped by `@workspace/shared`)
- `jose@6.1.3` — JWT handling
- `@supabase/ssr@0.8.0`, `@supabase/supabase-js@2.95.2` — real-time chat

### Forms & Validation
- `react-hook-form@7.71.1` — form state
- `@hookform/resolvers@5.2.2` — Zod resolver
- `zod@4.3.6` — schema validation

### UI & Styling
- `@workspace/ui` — custom component library (Shadcn-based)
- `tailwindcss@4.1.13` — styling
- `lucide-react@0.562.0` — icons
- `recharts@2.15.4` — charts
- `sonner@2.0.7` — toast notifications

### PDF & Image Processing
- `jspdf@4.0.0`, `jspdf-autotable@5.0.7` — invoice PDF export
- `html2canvas@1.4.1` — screenshot for PDF
- `dompurify@3.4.0` — HTML sanitization

### Other
- `use-debounce@10.1.0` — debounce hook
- `@openai/agents@0.4.6` — AI chat integration
- `isbot@5.1.31` — bot detection

---

## 10. KEY INTEGRATION POINTS

### Client Service Layer
**File:** `services/admin.client.ts`  
Wraps all API calls via axios:
- `adminClient.login()`, `adminClient.logout()`
- `adminClient.getCustomers()`, `adminClient.getCustomer(id)`, etc.
- `adminClient.getOrders()`, `adminClient.createOrder()`, etc.
- `adminClient.getChatRooms()`, `adminClient.sendChatMessage()`, etc.
Typed against `@workspace/database/types/*`

### Query Keys
**File:** `lib/query-keys.ts`  
React Query key factory:
```ts
queryKeys.admin.profile
queryKeys.admin.customers.list(filters)
queryKeys.customer(id)
queryKeys.admin.chat.rooms.list(search)
```

### Auth Utility
**File:** `lib/api-auth.ts`  
Exports `requireApiUser(request, level)` — used by all 72 API routes  
Returns `{ ok: true, user }` or `{ ok: false, response: NextResponse }`

---

## MIGRATION IMPLICATIONS

### Next.js Features to Replace
1. **next/link** → React Router or TanStack Router (if SPA) OR direct href navigation
2. **next/navigation** hooks (`useRouter`, `usePathname`, etc.) → React Router hooks
3. **next/font** → Web font import in CSS or Google Fonts link in HTML
4. **NextRequest/NextResponse** → Express/Node.js or Hono response objects
5. **API routes `/app/api/*`** → Standalone backend server (Node.js/Express, or keep as separate backend)
6. **Middleware** — none to migrate (not present)
7. **Dynamic imports** — `next/dynamic` in dashboard page → keep as-is or use Vite's dynamic imports

### What Stays the Same
- Client components (all pages are `"use client"`)
- React Query for data fetching & caching
- Zod validation schemas
- Service layer architecture (`adminClient.ts`)
- All UI components (from `@workspace/ui`)
- Layout structure (group folders can become route layout wrappers if using React Router)

### Backend Separation
Currently, API routes live in **same monorepo app**. For Vite migration:
- Option A: Extract API routes to standalone backend server (Node.js)
- Option B: Keep backend separate, admin frontend-only consumes via HTTP
Both options are transparent to the client app — only `API_ENDPOINTS` constant needs updating.

---

## SUMMARY TABLE

| Category | Count/Status | Notes |
|----------|--------------|-------|
| Pages | 26 | 25 dashboard (all `"use client"`), 1 public login |
| API Routes | 72 | GET (31), POST (19), PUT (7), PATCH (4), DELETE (10) |
| Server Actions | 0 | N/A — not used |
| Server Components | 0 | All pages are client |
| Layouts | 2 | Root (static), dashboard (client with auth check) |
| Middleware | 0 | N/A |
| Dynamic Routes | 4 | `[id]`, `[customerId]` |
| next/link usage | 32 | Breadcrumbs, navigation |
| next/image usage | 9 | Avatars, product/banner images |
| next/navigation hooks | 51 | Router, pathname, params, search params |
| next/font | 2 fonts | Cormorant Garamond, DM Sans |
| React Query | Heavy | Every page fetches data via `useQuery` |
| Forms | ~15 | React Hook Form + Zod validation |
| Client Services | 1 | `adminClient.ts` — all API calls |

