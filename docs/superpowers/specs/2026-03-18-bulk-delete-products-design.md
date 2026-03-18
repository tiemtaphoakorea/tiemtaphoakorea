# Bulk Delete Products — Design Spec

**Date:** 2026-03-18

## Overview

Add a "select mode" to the admin products page that allows bulk deletion of multiple products via a single API call.

## Backend

### New API Route

`DELETE /api/admin/products`

- **Body:** `{ ids: string[] }`
- **Auth:** existing `getInternalUser` check
- **Validation:** Return 400 if `ids` is missing, not an array, empty, or contains non-string values.
- **Logic:** Iterates over `ids` sequentially, calling the existing `deleteProduct()` server function for each. Sequential (not parallel) to avoid DB contention.
- **Response:** `{ deleted: number, failed: string[] }`
- **File:** `app/api/admin/products/route.ts` — add a `DELETE` handler alongside the existing `GET` and `POST`.
- **Cache:** Call `revalidatePath("/admin/products")` and `revalidatePath("/products")` after deletion (consistent with the existing POST handler).

### Error handling

If any IDs fail, the handler still returns 200 with `{ deleted: N, failed: [...] }`. The frontend shows an inline error noting how many failed if `failed.length > 0`, then refreshes and exits select mode regardless.

### Admin Client

Add `bulkDeleteProducts(ids: string[])` to `services/admin.client.ts`:

```ts
async bulkDeleteProducts(ids: string[]) {
  return axios.delete<{ deleted: number; failed: string[] }>(
    API_ENDPOINTS.ADMIN.PRODUCTS,   // "/api/admin/products"
    { data: { ids } },              // Axios requires { data: ... } to send body on DELETE
  ) as unknown as Promise<{ deleted: number; failed: string[] }>;
}
```

## Frontend

### Select Mode State

```ts
const [selectMode, setSelectMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const queryClient = useQueryClient();
```

**Exit helper:** sets `selectMode = false`, clears `selectedIds`, sets `bulkDeleteConfirm = false`.

**Escape key:** `useEffect` adds a `keydown` listener that calls the exit helper when `selectMode` is true and `key === "Escape"`. The effect returns a cleanup that removes the listener.

**Pagination:** `selectedIds` is cleared whenever the user navigates pages while `selectMode` is true (include in `onPaginationChange` alongside the existing `updateParams` call). This prevents deleting products that are no longer visible.

### Card Header Changes

**Normal mode:** Add a ghost "Chọn" button to the right of the filter Select.

**Select mode:** Replace the right side of the header with:
- `"X đã chọn"` count badge
- `"Xóa X sản phẩm"` destructive Button — **disabled** when `selectedIds.size === 0` or `isDeleting` is true; shows a spinner icon when `isDeleting`
- `"Hủy"` ghost Button to call the exit helper

### Checkbox Column

Memoize `columns` with `useMemo` (deps: `[selectMode, selectedIds]` only — `products` is not a dep since data flows through `row.original` at render time, not inside column definitions).

When `selectMode` is true, prepend a checkbox column:

- **Header cell:** A checkbox in three states — unchecked (none on current page selected), checked (all on current page selected), indeterminate (some selected). Clicking toggles all rows on the current page. Use the HTML `indeterminate` property on the input ref.
- **Row cell:** Checkbox bound to `selectedIds` set; clicking calls `setSelectedIds` toggling that product's ID.

Pass `onRowClick={undefined}` to `DataTable` when `selectMode` is true. This suppresses the row navigation handler entirely. The checkbox column only exists in select mode, so there is no scenario where both are active at the same time.

### Confirm Dialog

Reuse the existing `AlertDialog`. Open it by setting `bulkDeleteConfirm = true`.

Message: *"Bạn có chắc muốn xóa {N} sản phẩm? Hành động này không thể hoàn tác."*

**Important:** `AlertDialogAction` (Radix primitive) closes the dialog immediately on click. For the bulk confirm, use a plain `Button` styled as destructive for the confirm action instead of `AlertDialogAction`, so the dialog stays open while the async delete is in flight and shows the loading spinner.

On confirm:
1. Guard: if `selectedIds.size === 0`, return.
2. Set `isDeleting = true`.
3. Call `adminClient.bulkDeleteProducts([...selectedIds])`.
4. Await, then call `queryClient.invalidateQueries({ queryKey: ["products"] })` to bust the TanStack Query cache (5-minute staleTime would otherwise serve stale data after `router.refresh()`).
5. Call `router.refresh()` to re-fetch RSC data.
6. If `result.failed.length > 0`, show inline error: *"Xóa thành công {deleted} sản phẩm. Không thể xóa {failed.length} sản phẩm."*
7. Call exit helper (clears selection, closes dialog, exits select mode).
8. Set `isDeleting = false` in a `finally` block.

## Files Changed

| File | Change |
|------|--------|
| `app/api/admin/products/route.ts` | Add `DELETE` handler with input validation |
| `services/admin.client.ts` | Add `bulkDeleteProducts` method |
| `app/admin/(dashboard)/products/page.tsx` | Add select mode UI and bulk delete logic |
