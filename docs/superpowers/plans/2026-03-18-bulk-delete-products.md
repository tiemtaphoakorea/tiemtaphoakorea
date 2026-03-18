# Bulk Delete Products Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "select mode" to the admin products page so admins can select multiple products and delete them in one action.

**Architecture:** A new `DELETE /api/admin/products` route handles bulk deletion sequentially. The admin client gets a `bulkDeleteProducts` method. The products page gains a togglable select mode with native checkboxes, a confirmation dialog, and cache invalidation on completion.

**Tech Stack:** Next.js App Router, TanStack Query v5, TanStack Table v8, Radix UI AlertDialog, Axios, Drizzle ORM

---

## File Map

| File | Change |
|------|--------|
| `app/api/admin/products/route.ts` | Add `DELETE` handler |
| `services/admin.client.ts` | Add `bulkDeleteProducts` method |
| `app/admin/(dashboard)/products/page.tsx` | Add select mode UI and bulk delete logic |

---

## Task 1: Add bulk DELETE API route

**Files:**
- Modify: `app/api/admin/products/route.ts`

This task adds `export async function DELETE(request: Request)` to the existing route file. The handler:
1. Authenticates with `getInternalUser`
2. Parses and validates `ids` from the request body (400 if missing/empty/non-array/non-string elements)
3. Loops sequentially over ids calling the existing `deleteProduct(id)` from `services/product.server`
4. Tracks which ids succeeded and which failed
5. Calls `revalidatePath` for both paths
6. Returns `{ deleted: number, failed: string[] }`

- [ ] **Step 1: Add the DELETE handler to the route file**

Open `app/api/admin/products/route.ts`. Add this at the end of the file:

```ts
export async function DELETE(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const { ids } = (body as { ids?: unknown }) ?? {};

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.some((id) => typeof id !== "string")
  ) {
    return NextResponse.json(
      { error: "ids must be a non-empty array of strings" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const id of ids as string[]) {
    try {
      await deleteProduct(id);
      deleted.push(id);
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      failed.push(id);
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return NextResponse.json({ deleted: deleted.length, failed });
}
```

Also add `deleteProduct` to the existing import from `@/services/product.server` at the top of the file. The import line currently reads:
```ts
import {
  type CreateProductData,
  createProduct,
  generateProductSlug,
  getProducts,
  getProductsWithVariants,
} from "@/services/product.server";
```
Change it to:
```ts
import {
  type CreateProductData,
  createProduct,
  deleteProduct,
  generateProductSlug,
  getProducts,
  getProductsWithVariants,
} from "@/services/product.server";
```

- [ ] **Step 2: Verify the server compiles**

```bash
npx tsc --noEmit
```
Expected: no errors related to the new handler.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/products/route.ts
git commit -m "feat: add bulk DELETE /api/admin/products route"
```

---

## Task 2: Add bulkDeleteProducts to admin client

**Files:**
- Modify: `services/admin.client.ts`

- [ ] **Step 1: Add the method**

In `services/admin.client.ts`, find the existing `deleteProduct` method (around line 273):

```ts
async deleteProduct(id: string) {
  return axios.delete<{ success: boolean }>(
    `${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}`,
  ) as unknown as Promise<{ success: boolean }>;
},
```

Add `bulkDeleteProducts` immediately after it:

```ts
async bulkDeleteProducts(ids: string[]) {
  return axios.delete<{ deleted: number; failed: string[] }>(
    API_ENDPOINTS.ADMIN.PRODUCTS,
    { data: { ids } },
  ) as unknown as Promise<{ deleted: number; failed: string[] }>;
},
```

- [ ] **Step 2: Verify the server compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/admin.client.ts
git commit -m "feat: add bulkDeleteProducts to admin client"
```

---

## Task 3: Add select mode to products page

**Files:**
- Modify: `app/admin/(dashboard)/products/page.tsx`

This is the main UI task. Make all changes below to the products page file.

### 3a — Imports and state

- [ ] **Step 1: Update imports**

Change the TanStack Query import:
```ts
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
```

Update the lucide-react import to add `CheckSquare` and `Loader2`:
```ts
import { CheckSquare, Edit2, Image as ImageIcon, Loader2, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
```

Update the React import to add `useEffect` and `useMemo`:
```ts
import { useEffect, useMemo, useState } from "react";
```

- [ ] **Step 2: Add state variables and exit helper**

Inside `AdminProducts()`, after the existing `deleteTarget` state, add:

```ts
const [selectMode, setSelectMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [bulkError, setBulkError] = useState<string | null>(null);
const queryClient = useQueryClient();

const exitSelectMode = () => {
  setSelectMode(false);
  setSelectedIds(new Set());
  setBulkDeleteConfirm(false);
  setBulkError(null);
};
```

- [ ] **Step 3: Add Escape key listener**

After the `exitSelectMode` definition, add:

```ts
useEffect(() => {
  if (!selectMode) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") exitSelectMode();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectMode]);
```

### 3b — Checkbox column and memoized columns

- [ ] **Step 4: Wrap columns in useMemo and add checkbox column**

The existing `columns` is a plain `const` inside the component. Replace the entire `const columns: ColumnDef<ProductListItem>[] = [...]` block with a memoized version.

**Important notes:**
- Use native `<input type="checkbox">` (not a Checkbox UI component — this project has none).
- The header cell references `products` to compute the select-all/indeterminate state, so `products` is a required dep. Use deps `[selectMode, selectedIds, products]`. (The spec suggests omitting `products`, but that applies to row cells only — the header needs it.)
- Set `indeterminate` via a ref callback on the native input.

```ts
const columns = useMemo<ColumnDef<ProductListItem>[]>(() => {
  const checkboxColumn: ColumnDef<ProductListItem> = {
    id: "select",
    header: () => {
      const allSelected =
        products.length > 0 && products.every((p) => selectedIds.has(p.id));
      const someSelected = products.some((p) => selectedIds.has(p.id));
      return (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          onChange={(e) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (e.target.checked) {
                products.forEach((p) => next.add(p.id));
              } else {
                products.forEach((p) => next.delete(p.id));
              }
              return next;
            });
          }}
          aria-label="Chọn tất cả"
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer accent-primary"
        />
      );
    },
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedIds.has(row.original.id)}
        onChange={() => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(row.original.id)) {
              next.delete(row.original.id);
            } else {
              next.add(row.original.id);
            }
            return next;
          });
        }}
        aria-label={`Chọn ${row.original.name}`}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 cursor-pointer accent-primary"
      />
    ),
  };

  const baseColumns: ColumnDef<ProductListItem>[] = [
    // paste all the existing column definitions here unchanged
  ];

  return selectMode ? [checkboxColumn, ...baseColumns] : baseColumns;
}, [selectMode, selectedIds, products]);
```

> Move the entire existing column definitions array (thumbnail, name, categoryName, price, totalStock, isActive, actions columns) into `baseColumns`. Do not change those definitions — just move them.

### 3c — Bulk delete handler

- [ ] **Step 5: Add handleBulkDeleteConfirm**

After `handleDeleteConfirm`, add:

> `exitSelectMode` does NOT clear `bulkError` (defined in Step 2), so the error banner survives mode exit and shows in normal mode.

The complete handler:

```ts
const handleBulkDeleteConfirm = async () => {
  if (selectedIds.size === 0) return;
  setIsDeleting(true);
  try {
    const result = await adminClient.bulkDeleteProducts([...selectedIds]);
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    router.refresh();
    exitSelectMode();
    if (result.failed.length > 0) {
      setBulkError(
        `Xóa thành công ${result.deleted} sản phẩm. Không thể xóa ${result.failed.length} sản phẩm.`,
      );
    }
  } catch (error) {
    console.error(error);
    setBulkDeleteConfirm(false);
    setBulkError("Đã có lỗi xảy ra khi xóa sản phẩm.");
  } finally {
    setIsDeleting(false);
  }
};
```

Also update `exitSelectMode` to NOT clear `bulkError` (so the error banner survives the mode exit):

```ts
const exitSelectMode = () => {
  setSelectMode(false);
  setSelectedIds(new Set());
  setBulkDeleteConfirm(false);
};
```

### 3d — Update onPaginationChange

- [ ] **Step 6: Clear selection on page change**

Find the `onPaginationChange` prop passed to `DataTable`:

```ts
onPaginationChange={(newPagination) => {
  updateParams({
    page: newPagination.pageIndex + 1,
    limit: newPagination.pageSize,
  });
}}
```

Change it to:

```ts
onPaginationChange={(newPagination) => {
  if (selectMode) setSelectedIds(new Set());
  updateParams({
    page: newPagination.pageIndex + 1,
    limit: newPagination.pageSize,
  });
}}
```

### 3e — Card header UI

- [ ] **Step 7: Update the card header**

Find the `<div className="flex items-center gap-2">` that contains the `<Select>` (stock status filter) in `CardHeader`. Replace it with:

```tsx
<div className="flex items-center gap-2">
  {selectMode ? (
    <>
      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
        {selectedIds.size} đã chọn
      </span>
      <Button
        variant="destructive"
        size="sm"
        disabled={selectedIds.size === 0 || isDeleting}
        onClick={() => setBulkDeleteConfirm(true)}
        className="gap-2"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Xóa {selectedIds.size} sản phẩm
      </Button>
      <Button variant="ghost" size="sm" onClick={exitSelectMode}>
        Hủy
      </Button>
    </>
  ) : (
    <>
      <Select value={stockStatus} onValueChange={(val) => updateParams({ stockStatus: val })}>
        <SelectTrigger
          className="h-10 w-full border-none bg-slate-50/50 ring-1 ring-slate-200 md:w-[180px] dark:bg-slate-900/50 dark:ring-slate-800"
          aria-label="Lọc tồn kho thấp, hết hàng"
        >
          <SelectValue placeholder="Lọc tồn kho" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="low_stock">Sắp hết</SelectItem>
          <SelectItem value="out_of_stock">Hết hàng</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectMode(true)}
        className="gap-2 font-bold"
      >
        <CheckSquare className="h-4 w-4" />
        Chọn
      </Button>
    </>
  )}
</div>
```

### 3f — Error banner

- [ ] **Step 8: Add error banner**

After the existing `{updated && ...}` success banner, add:

```tsx
{bulkError && (
  <div
    role="alert"
    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700"
  >
    {bulkError}
  </div>
)}
```

### 3g — Bulk confirm dialog

- [ ] **Step 9: Add bulk delete confirmation dialog**

Right after the existing single-delete `AlertDialog` closing tag, add:

```tsx
<AlertDialog open={bulkDeleteConfirm} onOpenChange={(open) => !open && setBulkDeleteConfirm(false)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Xóa sản phẩm</AlertDialogTitle>
      <AlertDialogDescription>
        Bạn có chắc muốn xóa <strong>{selectedIds.size} sản phẩm</strong>? Hành động này không thể hoàn tác.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
      {/* Plain Button (not AlertDialogAction) keeps dialog open during async delete */}
      <Button
        variant="destructive"
        disabled={isDeleting}
        onClick={handleBulkDeleteConfirm}
        className="gap-2"
      >
        {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
        Xóa
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3h — Suppress row click in select mode

- [ ] **Step 10: Pass onRowClick conditionally**

Find the `onRowClick` prop on `<DataTable>`:

```tsx
onRowClick={(row) => handleEdit(row.original.id)}
```

Change it to:

```tsx
onRowClick={selectMode ? undefined : (row) => handleEdit(row.original.id)}
```

### 3i — Final check

- [ ] **Step 11: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add app/admin/(dashboard)/products/page.tsx
git commit -m "feat: add bulk delete select mode to products page"
```

---

## Task 4: Manual smoke test

- [ ] Start the dev server: `npm run dev`
- [ ] Navigate to `/admin/products`
- [ ] Click "Chọn" — verify select mode activates (checkboxes appear, header changes)
- [ ] Check a few rows — verify count badge updates
- [ ] Check all via header checkbox — verify indeterminate → checked transition
- [ ] Click "Xóa N sản phẩm" — verify confirm dialog opens with correct count
- [ ] Click "Hủy" in dialog — verify dialog closes, selection preserved, spinner gone
- [ ] Confirm delete — verify products are deleted and table refreshes
- [ ] Press Escape while in select mode — verify mode exits
- [ ] Navigate to page 2 while in select mode — verify selection clears
- [ ] Verify "Hủy" button in header exits select mode
- [ ] Verify clicking a row in normal mode still navigates to edit page
