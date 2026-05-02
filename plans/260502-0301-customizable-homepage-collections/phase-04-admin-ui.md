# Phase 04 — Admin UI (List, Form, Picker, Nav)

**Goal:** Build the `/dashboard/homepage` admin page: drag-drop list of collections, isActive toggles, create/edit form with conditional fields, manual product picker with drag-drop sorting. Add nav entry.

**Depends on:** Phase 3 complete (API + client + query keys).

**Files:**
- Create: `apps/admin/app/(dashboard)/homepage/page.tsx`
- Create: `apps/admin/app/(dashboard)/homepage/_content.tsx`
- Create: `apps/admin/app/(dashboard)/homepage/_components/collection-list.tsx`
- Create: `apps/admin/app/(dashboard)/homepage/_components/collection-row.tsx`
- Create: `apps/admin/app/(dashboard)/homepage/_components/collection-form-drawer.tsx`
- Create: `apps/admin/app/(dashboard)/homepage/_components/manual-product-picker.tsx`
- Create: `apps/admin/app/(dashboard)/homepage/_components/icon-select.tsx`
- Modify: `apps/admin/components/layout/admin-sidebar.tsx` (nav entry)
- Modify: `packages/shared/src/routes.ts` (`ADMIN_ROUTES.HOMEPAGE`)
- Modify: `packages/shared/src/constants.ts` (`ADMIN_ROUTE_NAMES.homepage`)
- Modify: `apps/admin/package.json` (+ `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)

---

## Task 4.1: Add deps + route constants

- [ ] **Step 1: Add dnd-kit packages**

```bash
pnpm --filter @workspace/admin add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Verify they appear in `apps/admin/package.json`.

- [ ] **Step 2: Add route constant**

Edit `packages/shared/src/routes.ts` — within `ADMIN_ROUTES`, add line near related entries:

```ts
HOMEPAGE: "/homepage",
```

- [ ] **Step 3: Add route name (Vietnamese label)**

Edit `packages/shared/src/constants.ts` — within `ADMIN_ROUTE_NAMES` map, add:

```ts
homepage: "Trang chủ",
```

- [ ] **Step 4: Type-check**

```bash
pnpm --filter @workspace/shared typecheck 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/package.json pnpm-lock.yaml \
        packages/shared/src/routes.ts packages/shared/src/constants.ts
git commit -m "chore(admin): add dnd-kit + homepage route constants"
```

---

## Task 4.2: Investigate existing product picker pattern

- [ ] **Step 1: Search existing admin code**

```bash
grep -rln "product.*search\|product.*picker\|product.*combobox" \
  /Users/kien.ha/Code/auth_shop_platform/apps/admin/app \
  /Users/kien.ha/Code/auth_shop_platform/apps/admin/components 2>/dev/null | head -10
```

- [ ] **Step 2: Check orders page for product selection**

```bash
grep -rn "getProductsWithVariants\|getProducts" \
  /Users/kien.ha/Code/auth_shop_platform/apps/admin/app/\(dashboard\)/orders 2>/dev/null | head -10
```

- [ ] **Step 3: Decide approach**

If a reusable picker component exists → reuse it.
If not → build a minimal Combobox-based search inside `manual-product-picker.tsx`. Note decision in commit message of Task 4.5.

---

## Task 4.3: Page entry + content shell

- [ ] **Step 1: Create page.tsx (server component shell)**

Create `apps/admin/app/(dashboard)/homepage/page.tsx`:

```tsx
import HomepageContent from "./_content";

export default function HomepagePage() {
  return <HomepageContent />;
}
```

- [ ] **Step 2: Create _content.tsx (client root)**

Create `apps/admin/app/(dashboard)/homepage/_content.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { CollectionFormDrawer } from "./_components/collection-form-drawer";
import { CollectionList } from "./_components/collection-list";

export default function HomepageContent() {
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  // undefined = closed, null = creating new, string = editing existing

  const collectionsQuery = useQuery({
    queryKey: queryKeys.homepageCollections.list,
    queryFn: () => adminClient.listHomepageCollections(),
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {collectionsQuery.isLoading
            ? "Đang tải..."
            : `${collectionsQuery.data?.length ?? 0} collections`}
        </span>
        <Button className="h-[34px] gap-1.5" onClick={() => setEditingId(null)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tạo collection
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <CollectionList
          collections={collectionsQuery.data ?? []}
          isLoading={collectionsQuery.isLoading}
          onEdit={(id) => setEditingId(id)}
        />
      </Card>

      {editingId !== undefined && (
        <CollectionFormDrawer
          collectionId={editingId}
          onClose={() => setEditingId(undefined)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit (skeleton — list/form components added next)**

```bash
git add apps/admin/app/\(dashboard\)/homepage/page.tsx \
        apps/admin/app/\(dashboard\)/homepage/_content.tsx
git commit -m "feat(admin): scaffold homepage collections page"
```

---

## Task 4.4: Collection list with drag-drop reorder + isActive toggle

- [ ] **Step 1: Create collection-row.tsx**

Create `apps/admin/app/(dashboard)/homepage/_components/collection-row.tsx`:

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  manual: "Thủ công",
  best_sellers: "Bán chạy",
  new_arrivals: "Mới về",
  by_category: "Theo danh mục",
};

export type CollectionRowData = {
  id: string;
  type: keyof typeof TYPE_LABELS;
  title: string;
  isActive: boolean;
  itemLimit: number;
  productCount: number;
  daysWindow: number | null;
  categoryId: string | null;
};

type Props = {
  collection: CollectionRowData;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
};

export function CollectionRow({ collection, onEdit, onDelete, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: collection.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta: string[] = [TYPE_LABELS[collection.type] ?? collection.type];
  meta.push(`limit ${collection.itemLimit}`);
  if (collection.type === "manual") meta.push(`${collection.productCount} sản phẩm`);
  if (collection.type === "new_arrivals") meta.push(`${collection.daysWindow ?? 30} ngày`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border-b border-border bg-white p-3 last:border-b-0"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{collection.title}</div>
        <div className="text-xs text-muted-foreground">{meta.join(" · ")}</div>
      </div>

      <Switch checked={collection.isActive} onCheckedChange={onToggle} />

      <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Sửa">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Xoá">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create collection-list.tsx**

Create `apps/admin/app/(dashboard)/homepage/_components/collection-list.tsx`:

```tsx
"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { CollectionRow, type CollectionRowData } from "./collection-row";

type Props = {
  collections: CollectionRowData[];
  isLoading: boolean;
  onEdit: (id: string) => void;
};

export function CollectionList({ collections, isLoading, onEdit }: Props) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(collections);
  const [deleteTarget, setDeleteTarget] = useState<CollectionRowData | null>(null);

  // Keep local state in sync with query data when not actively dragging
  if (
    items.length !== collections.length ||
    items.some((it, i) => it.id !== collections[i]?.id)
  ) {
    setItems(collections);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => adminClient.reorderHomepageCollections(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminClient.updateHomepageCollection(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteHomepageCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
      setDeleteTarget(null);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    reorderMutation.mutate(next.map((c) => c.id));
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (items.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">Chưa có collection nào.</div>;
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((c) => (
            <CollectionRow
              key={c.id}
              collection={c}
              onEdit={() => onEdit(c.id)}
              onDelete={() => setDeleteTarget(c)}
              onToggle={(isActive) => toggleMutation.mutate({ id: c.id, isActive })}
            />
          ))}
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá collection?"
        description={`Sẽ xoá "${deleteTarget?.title}" khỏi homepage. Không thể hoàn tác.`}
        confirmLabel="Xoá"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify ConfirmDialog props match**

```bash
grep -A 5 "type ConfirmDialogProps\|interface ConfirmDialogProps" /Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/shared/confirm-dialog.tsx
```

If prop names differ (e.g. `onClose` instead of `onCancel`, `message` instead of `description`) — adjust the call in `collection-list.tsx`.

- [ ] **Step 4: Type-check**

```bash
pnpm --filter @workspace/admin typecheck 2>&1 | tail -20
```

- [ ] **Step 5: Manual smoke**

```bash
pnpm --filter @workspace/admin dev
```

Open `http://localhost:3001/homepage`. Verify:
- 3 seeded collections render
- Drag handle reorders items; refresh persists order
- Switch toggles isActive; refresh persists
- Delete button opens confirm; confirming removes row

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/\(dashboard\)/homepage/_components/collection-list.tsx \
        apps/admin/app/\(dashboard\)/homepage/_components/collection-row.tsx
git commit -m "feat(admin): add homepage collection list with dnd reorder"
```

---

## Task 4.5: Collection form drawer (create/edit)

- [ ] **Step 1: Create icon-select.tsx**

Create `apps/admin/app/(dashboard)/homepage/_components/icon-select.tsx`:

```tsx
"use client";

import { GENERATED_ICONS } from "@/components/sections/generated-icon"; // verify path; if not exposed, copy keys list locally
import { cn } from "@workspace/ui/lib/utils";

const ICON_KEYS = Object.keys(GENERATED_ICONS) as Array<keyof typeof GENERATED_ICONS>;

type Props = {
  value: string | null;
  onChange: (key: string | null) => void;
};

export function IconSelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "h-10 w-10 rounded-lg border-2 text-xs",
          value === null ? "border-primary bg-primary/10" : "border-border",
        )}
      >
        ∅
      </button>
      {ICON_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "h-10 w-10 rounded-lg border-2 p-1",
            value === key ? "border-primary bg-primary/10" : "border-border",
          )}
          title={key}
        >
          <img src={GENERATED_ICONS[key]} alt={key} className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  );
}
```

Note: `GENERATED_ICONS` lives in `apps/main/components/sections/generated-icon.tsx`. Either:
(a) Move it to a shared location (`packages/ui` or `packages/shared`) and re-import in both apps. Recommended.
(b) Duplicate the keys/SVG paths here.

For (a), create `packages/shared/src/generated-icons.ts` exporting the same map, then update both apps to import from there. Adjust paths accordingly.

- [ ] **Step 2: Create collection-form-drawer.tsx**

Create `apps/admin/app/(dashboard)/homepage/_components/collection-form-drawer.tsx`:

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { IconSelect } from "./icon-select";
import { ManualProductPicker } from "./manual-product-picker";

const TYPES = [
  { value: "manual", label: "Thủ công (chọn sản phẩm)" },
  { value: "best_sellers", label: "Bán chạy (auto)" },
  { value: "new_arrivals", label: "Mới về (auto theo ngày tạo)" },
  { value: "by_category", label: "Theo danh mục" },
] as const;

type CollectionType = (typeof TYPES)[number]["value"];

type FormState = {
  type: CollectionType;
  title: string;
  subtitle: string;
  iconKey: string | null;
  viewAllUrl: string;
  itemLimit: number;
  isActive: boolean;
  categoryId: string | null;
  daysWindow: number;
};

const EMPTY: FormState = {
  type: "manual",
  title: "",
  subtitle: "",
  iconKey: null,
  viewAllUrl: "",
  itemLimit: 8,
  isActive: true,
  categoryId: null,
  daysWindow: 30,
};

type Props = {
  collectionId: string | null; // null = create
  onClose: () => void;
};

export function CollectionFormDrawer({ collectionId, onClose }: Props) {
  const queryClient = useQueryClient();
  const isEdit = collectionId !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [productIds, setProductIds] = useState<string[]>([]);

  const detailQuery = useQuery({
    queryKey: queryKeys.homepageCollections.detail(collectionId ?? ""),
    queryFn: () => adminClient.getHomepageCollection(collectionId!),
    enabled: isEdit,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(""),
    queryFn: () => adminClient.getCategories({}),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const c = detailQuery.data;
    setForm({
      type: c.type,
      title: c.title,
      subtitle: c.subtitle ?? "",
      iconKey: c.iconKey,
      viewAllUrl: c.viewAllUrl ?? "",
      itemLimit: c.itemLimit,
      isActive: c.isActive,
      categoryId: c.categoryId,
      daysWindow: c.daysWindow ?? 30,
    });
    setProductIds((c.products ?? []).map((p: { productId: string }) => p.productId));
  }, [isEdit, detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        iconKey: form.iconKey,
        viewAllUrl: form.viewAllUrl.trim() || null,
        itemLimit: form.itemLimit,
        isActive: form.isActive,
        categoryId: form.type === "by_category" ? form.categoryId : null,
        daysWindow: form.type === "new_arrivals" ? form.daysWindow : null,
      };
      const collection = isEdit
        ? await adminClient.updateHomepageCollection(collectionId!, payload)
        : await adminClient.createHomepageCollection(payload);
      if (form.type === "manual") {
        await adminClient.setHomepageCollectionProducts(collection.id, productIds);
      }
      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
      onClose();
    },
  });

  const canSave = form.title.trim().length > 0 &&
    (form.type !== "by_category" || form.categoryId);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Sửa collection" : "Tạo collection"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-4">
          <div>
            <Label>Loại</Label>
            <Select
              value={form.type}
              onValueChange={(v) => {
                const next = v as CollectionType;
                if (form.type === "manual" && next !== "manual" && productIds.length > 0) {
                  if (!confirm("Đổi loại sẽ xoá danh sách sản phẩm thủ công. Tiếp tục?")) return;
                  setProductIds([]);
                }
                setForm({ ...form, type: next });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tiêu đề *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="vd: Bán chạy nhất"
            />
          </div>

          <div>
            <Label>Phụ đề</Label>
            <Textarea
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label>Icon</Label>
            <IconSelect
              value={form.iconKey}
              onChange={(k) => setForm({ ...form, iconKey: k })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Số sản phẩm (limit)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.itemLimit}
                onChange={(e) => setForm({ ...form, itemLimit: Number(e.target.value) || 8 })}
              />
            </div>
            <div>
              <Label>View all URL</Label>
              <Input
                value={form.viewAllUrl}
                onChange={(e) => setForm({ ...form, viewAllUrl: e.target.value })}
                placeholder="/products"
              />
            </div>
          </div>

          {form.type === "by_category" && (
            <div>
              <Label>Danh mục *</Label>
              <Select
                value={form.categoryId ?? ""}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data?.flatCategories ?? []).map((c: { id: string; name: string }) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.type === "new_arrivals" && (
            <div>
              <Label>Cửa sổ ngày (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.daysWindow}
                onChange={(e) => setForm({ ...form, daysWindow: Number(e.target.value) || 30 })}
              />
            </div>
          )}

          {form.type === "manual" && (
            <div>
              <Label>Sản phẩm trong collection</Label>
              <ManualProductPicker value={productIds} onChange={setProductIds} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Huỷ</Button>
            <Button
              disabled={!canSave || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

Note: `adminClient.getCategories` is assumed to exist (used in categories admin page). If shape differs, adjust the `categoriesQuery.data?.flatCategories` access — check `_content.tsx` for categories page for exact shape.

- [ ] **Step 3: Verify Sheet, Select, Textarea, Switch components are exported from `@workspace/ui`**

```bash
ls /Users/kien.ha/Code/auth_shop_platform/packages/ui/src/components/ | grep -E "sheet|select|textarea|switch"
```

If any missing → run shadcn add or follow project's component pattern.

- [ ] **Step 4: Type-check**

```bash
pnpm --filter @workspace/admin typecheck 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/\(dashboard\)/homepage/_components/collection-form-drawer.tsx \
        apps/admin/app/\(dashboard\)/homepage/_components/icon-select.tsx \
        packages/shared/src/generated-icons.ts \
        apps/main/components/sections/generated-icon.tsx
git commit -m "feat(admin): add collection form drawer with conditional fields"
```

---

## Task 4.6: Manual product picker

- [ ] **Step 1: Create manual-product-picker.tsx**

Create `apps/admin/app/(dashboard)/homepage/_components/manual-product-picker.tsx`:

```tsx
"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { GripVertical, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type Props = {
  value: string[]; // ordered product ids
  onChange: (ids: string[]) => void;
};

type ProductLite = { id: string; name: string; thumbnail: string | null };

export function ManualProductPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 300);
  const [open, setOpen] = useState(false);

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list({ search: debounced, page: 1 }),
    queryFn: () => adminClient.getProducts({ search: debounced || undefined, limit: 20 }),
    staleTime: 30_000,
  });

  // Cache fetched products by id so removed picks can still display name
  const [productCache, setProductCache] = useState<Record<string, ProductLite>>({});

  // Hydrate cache when product list loads
  useMemo(() => {
    const list: ProductLite[] = productsQuery.data?.products ?? [];
    if (list.length === 0) return;
    setProductCache((prev) => {
      const next = { ...prev };
      for (const p of list) next[p.id] = { id: p.id, name: p.name, thumbnail: p.thumbnail };
      return next;
    });
  }, [productsQuery.data]);

  // Fetch missing products for ids in `value` not yet in cache (initial load when editing)
  useQuery({
    queryKey: ["picker-resolve", value.filter((id) => !productCache[id])],
    queryFn: async () => {
      const missing = value.filter((id) => !productCache[id]);
      if (missing.length === 0) return [];
      const result = await adminClient.getProducts({ ids: missing.join(","), limit: missing.length });
      const list: ProductLite[] = result.products ?? [];
      setProductCache((prev) => {
        const next = { ...prev };
        for (const p of list) next[p.id] = { id: p.id, name: p.name, thumbnail: p.thumbnail };
        return next;
      });
      return list;
    },
    enabled: value.some((id) => !productCache[id]),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = value.indexOf(active.id as string);
    const newIdx = value.indexOf(over.id as string);
    onChange(arrayMove(value, oldIdx, newIdx));
  }

  function add(id: string) {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setOpen(false);
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  const candidates: ProductLite[] = (productsQuery.data?.products ?? []).filter(
    (p: ProductLite) => !value.includes(p.id),
  );

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Thêm sản phẩm
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[360px]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm sản phẩm..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {productsQuery.isLoading ? "Đang tải..." : "Không có kết quả"}
              </CommandEmpty>
              <CommandGroup>
                {candidates.map((p) => (
                  <CommandItem key={p.id} value={p.id} onSelect={() => add(p.id)}>
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {value.length === 0 && (
              <div className="text-xs text-muted-foreground italic">Chưa có sản phẩm</div>
            )}
            {value.map((id, idx) => (
              <SortableProductItem
                key={id}
                id={id}
                index={idx}
                product={productCache[id]}
                onRemove={() => remove(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableProductItem({
  id,
  index,
  product,
  onRemove,
}: {
  id: string;
  index: number;
  product: ProductLite | undefined;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border bg-white p-2"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
      <span className="flex-1 text-sm truncate">{product?.name ?? id}</span>
      <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Xoá">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
```

Note: `adminClient.getProducts` signature — check existing call sites to confirm `{ search, limit, ids }` params are supported. If `ids` filter doesn't exist, accept the gap: products in `value` will only show their ID until user searches them. Document in commit message.

- [ ] **Step 2: Type-check**

```bash
pnpm --filter @workspace/admin typecheck 2>&1 | tail -30
```

- [ ] **Step 3: Manual smoke**

In running dev:
- Open `/homepage`, click "Tạo collection"
- Type = manual, title = "Test", add 2-3 products via picker
- Drag to reorder products
- Save → verify it appears in list
- Re-open → verify products + order persisted

- [ ] **Step 4: Commit**

```bash
git add apps/admin/app/\(dashboard\)/homepage/_components/manual-product-picker.tsx
git commit -m "feat(admin): add manual product picker with dnd sort"
```

---

## Task 4.7: Sidebar nav entry

- [ ] **Step 1: Edit admin-sidebar.tsx**

Edit `apps/admin/components/layout/admin-sidebar.tsx`. In the "Quản trị" section's `items` array, add (after `Danh mục`):

```ts
{ icon: Home, label: "Trang chủ", href: ADMIN_ROUTES.HOMEPAGE },
```

Add `Home` to lucide imports at top of file.

- [ ] **Step 2: Verify**

```bash
pnpm --filter @workspace/admin typecheck 2>&1 | tail -10
```

- [ ] **Step 3: Manual verify**

Reload admin app — sidebar shows "Trang chủ" entry; clicking navigates to `/homepage`.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/layout/admin-sidebar.tsx
git commit -m "feat(admin): add Trang chủ entry to sidebar"
```

---

## Task 4.8: End-to-end smoke

- [ ] **Step 1: Start both apps**

```bash
pnpm dev
```

- [ ] **Step 2: Admin verification flow**

In `http://localhost:3001/homepage`:
1. Reorder collections via drag → reload → order persists
2. Toggle isActive on "Hàng mới về" → reload main app `http://localhost:3000` → section gone
3. Re-enable, reload main → section back
4. Click "Tạo collection" → type=`by_category`, title="Eyewear", select a category, save → reload main, section appears below others
5. Click "Sửa" on Featured (manual, empty) → add 2-3 products → save → reload main, "Featured" shows

- [ ] **Step 3: Run full test suite**

```bash
pnpm test 2>&1 | tail -30
```

Expected: all pre-existing + new tests pass; no regressions.

- [ ] **Step 4: Commit anything outstanding**

If smoke uncovered minor fixes, batch into one commit:

```bash
git add -A
git commit -m "fix(admin): polish homepage collection UX after smoke test"
```

---

## Phase 4 Done When

- [ ] `/homepage` route renders list, drag-drop reorder works, isActive toggles work
- [ ] Form drawer creates + edits all 4 collection types
- [ ] Manual picker adds + removes + reorders products
- [ ] Sidebar nav shows "Trang chủ"
- [ ] Customer homepage reflects all admin changes after refresh
- [ ] Full test suite passes
- [ ] All commits pushed
