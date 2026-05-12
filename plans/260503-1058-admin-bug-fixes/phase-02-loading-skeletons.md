---
phase: 2
title: "Loading Skeletons"
status: completed
priority: P2
effort: "1.5h"
dependencies: []
---

# Phase 2: Loading Skeletons

## Overview
Replace `loading: () => null` with a generic `PageSkeleton` component in all 27 admin dynamic-import pages so users see a loading state instead of a blank white screen.

## Requirements
- All `dynamic(() => import("./_content"), { loading: () => null })` pages must show a skeleton
- Skeleton must match typical admin page layout (header row + table rows)
- Single reusable component — no duplication per page

## Architecture

### Shared skeleton component
Create `apps/admin/components/layout/page-skeleton.tsx`:
```tsx
import { Skeleton } from "@workspace/ui/components/skeleton";

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Header bar: filter + button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-8 w-28 rounded" />
      </div>
      {/* Table rows */}
      <div className="rounded-lg border border-border bg-white">
        <div className="border-b px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-full opacity-70" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Update pattern for every page
Replace `loading: () => null` → `loading: () => <PageSkeleton />`:
```tsx
import { PageSkeleton } from "@/components/layout/page-skeleton";

const Content = dynamic(() => import("./_content"), {
  ssr: false,
  loading: () => <PageSkeleton />,
});
```

## Related Code Files
- Create: `apps/admin/components/layout/page-skeleton.tsx`
- Modify (27 files — `loading: () => null`):
  - `app/(dashboard)/page.tsx`
  - `app/(dashboard)/products/page.tsx`
  - `app/(dashboard)/orders/page.tsx`
  - `app/(dashboard)/orders/new/page.tsx`
  - `app/(dashboard)/orders/[id]/page.tsx`
  - `app/(dashboard)/customers/page.tsx`
  - `app/(dashboard)/customers/[id]/page.tsx`
  - `app/(dashboard)/debts/page.tsx`
  - `app/(dashboard)/debts/[customerId]/page.tsx`
  - `app/(dashboard)/settings/page.tsx`
  - `app/(dashboard)/products/new/page.tsx`
  - `app/(dashboard)/products/[id]/edit/page.tsx`
  - `app/(dashboard)/suppliers/page.tsx`
  - `app/(dashboard)/supplier-orders/page.tsx`
  - `app/(dashboard)/chat/page.tsx`
  - `app/(dashboard)/content/page.tsx`
  - `app/(dashboard)/expenses/page.tsx`
  - `app/(dashboard)/users/page.tsx`
  - `app/(dashboard)/inventory/page.tsx`
  - `app/(dashboard)/widgets/page.tsx`
  - `app/(dashboard)/categories/page.tsx`
  - `app/(dashboard)/analytics/page.tsx`
  - `app/(dashboard)/analytics/overview/page.tsx`
  - `app/(dashboard)/analytics/products/page.tsx`
  - `app/(dashboard)/analytics/finance/page.tsx`
  - `app/(dashboard)/analytics/finance/detail/page.tsx`
  - `app/(dashboard)/analytics/inventory/page.tsx`

## Implementation Steps
1. Create `page-skeleton.tsx` with the layout above
2. Use sed/multiEdit to batch-replace all 27 page files (add import + swap `() => null` → `() => <PageSkeleton />`)
3. Verify no TypeScript errors: `pnpm --filter admin typecheck`

## Success Criteria
- [x] Navigating to any page shows skeleton rows before content appears
- [x] No blank white screen on initial page load
- [x] TypeScript compiles without errors

## Risk Assessment
Low — purely additive UI. The 27 file edits are mechanical; risk is a missed file. Use grep to verify none remain after edits.
