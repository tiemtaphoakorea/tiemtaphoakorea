---
phase: 3
title: "Global Search"
status: completed
priority: P2
effort: "3h"
dependencies: [1, 2]
---

# Phase 3: Global Search

## Overview
Wire up the existing "Tìm kiếm nhanh" input in the admin header to search across products, orders, and customers. Show a dropdown with grouped results; clicking navigates to the detail/list page.

## Requirements
- Search triggers on input (300ms debounce), min 2 chars
- Results grouped: Sản phẩm / Đơn hàng / Khách hàng — max 4 items each
- Clicking a result navigates to the relevant page
- Keyboard navigation: Arrow up/down + Enter to select, Escape to close
- No new API endpoints — reuse existing `/api/admin/products`, `/api/admin/orders`, `/api/admin/customers` with `search=` param and `limit=4`

## Architecture

### Component tree
```
layout.tsx
└── GlobalSearch (new component)
    ├── Input (existing, extracted)
    └── SearchDropdown (new)
        ├── SearchResultGroup (products)
        ├── SearchResultGroup (orders)
        └── SearchResultGroup (customers)
```

### Data flow
1. User types ≥ 2 chars → debounced `query` state updates
2. Three `useQuery` hooks fire in parallel (`enabled: query.length >= 2`):
   - `GET /api/admin/products?search={q}&limit=4`
   - `GET /api/admin/orders?search={q}&limit=4`
   - `GET /api/admin/customers?search={q}&limit=4`
3. Results render in dropdown; any loading → show spinner per group
4. Click → `router.push(href)` + close dropdown
5. Click outside → close (use `useOnClickOutside` or `onBlur` with delay)

### Result item shapes
| Entity | Display | href |
|--------|---------|------|
| Product | name + SKU | `/products/{id}/edit` |
| Order | order code + customer name | `/orders/{id}` |
| Customer | fullName + phone | `/customers/{id}` |

## Related Code Files
- Create: `apps/admin/components/layout/global-search.tsx`
- Modify: `apps/admin/app/(dashboard)/layout.tsx` — replace raw `<Input>` block with `<GlobalSearch />`

## Implementation Steps

1. **Create `global-search.tsx`**
   - `useState` for `inputValue` + `open`
   - `useDebounce(inputValue, 300)` → `debouncedQuery`
   - Three `useQuery` hooks with `enabled: debouncedQuery.length >= 2`
   - Render a `Popover`/`div` dropdown below the input when `open && debouncedQuery`
   - Keyboard handler: `onKeyDown` on the input for Arrow/Enter/Escape

2. **Extract result-group sub-component** (inline or separate file if > 60 lines)
   ```tsx
   function ResultGroup({ label, items, isLoading, renderItem }) { ... }
   ```

3. **Replace layout input block**
   `layout.tsx:118-125` — delete the raw `<div>…<Input>…</div>` block, insert `<GlobalSearch />`.

4. **Verify existing API params** accept `search` + `limit`:
   - `app/api/admin/products/route.ts` → already supports `search` param ✓
   - `app/api/admin/orders/route.ts` → already supports `search` param ✓
   - `app/api/admin/customers/route.ts` → already supports `search` param ✓

5. Compile + smoke test: type "kinh" → should show product results

## Success Criteria
- [x] Typing 2+ chars shows grouped dropdown within ~400ms
- [x] Clicking a result navigates correctly
- [x] Escape or click outside closes dropdown
- [x] Empty state shows "Không tìm thấy kết quả" when all groups empty
- [x] TypeScript compiles without errors

## Risk Assessment
- Popover z-index: use `z-50` to avoid sidebar overlap
- Race conditions: `useQuery` with `staleTime: 0` + `enabled` flag handles cancellation correctly
- Mobile: search bar is `hidden md:flex` — no mobile concern for now
