# Category Tree Inline Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a search input to the category tree selector that filters nodes live — matching names are highlighted, non-matching nodes fade to grey, and parent nodes auto-expand when they contain a match.

**Architecture:** All logic is self-contained in `category-tree-selector.tsx`. A `computeFilterSets` helper walks the tree to build two sets — `matchingIds` and `ancestorIds` — which drive per-node highlight and expand behaviour. `TreeNode` receives these sets plus the raw query string as props so it can render conditionally without knowing about global state.

**Tech Stack:** React (useState), Tailwind CSS, lucide-react (existing), `@workspace/ui` Popover + ScrollArea (existing).

---

### Task 1: Add `computeFilterSets` helper and `query` state

**Files:**
- Modify: `apps/admin/components/admin/products/category-tree-selector.tsx`

This task adds the filter logic only — no UI changes yet. After this task the component still renders identically; we're just wiring up the data layer.

- [ ] **Step 1: Add `computeFilterSets` function** after the `findCategoryName` function (around line 54):

```ts
/**
 * Walk the tree and return:
 *  - matchingIds  — nodes whose name contains the query (case-insensitive)
 *  - ancestorIds  — nodes that are ancestors of at least one match
 */
function computeFilterSets(
  nodes: CategoryNode[],
  query: string,
): { matchingIds: Set<string>; ancestorIds: Set<string> } {
  const matchingIds = new Set<string>();
  const ancestorIds = new Set<string>();
  const q = query.toLowerCase();

  function walk(node: CategoryNode, ancestors: string[]): boolean {
    const isMatch = node.name.toLowerCase().includes(q);
    if (isMatch) matchingIds.add(node.id);

    let childMatched = false;
    for (const child of node.children) {
      if (walk(child, [...ancestors, node.id])) childMatched = true;
    }

    if (isMatch || childMatched) {
      for (const id of ancestors) ancestorIds.add(id);
    }

    return isMatch || childMatched;
  }

  for (const root of nodes) walk(root, []);
  return { matchingIds, ancestorIds };
}
```

- [ ] **Step 2: Add `query` state to `CategoryTreeSelector`** and derive the filter sets:

Inside `CategoryTreeSelector`, after the existing `const [open, setOpen] = useState(false);` line, add:

```ts
const [query, setQuery] = useState("");
const trimmed = query.trim();
const { matchingIds, ancestorIds } =
  trimmed.length > 0
    ? computeFilterSets(tree, trimmed)
    : { matchingIds: new Set<string>(), ancestorIds: new Set<string>() };
```

- [ ] **Step 3: Reset query when popover closes**

Update the `onOpenChange` handler:

```tsx
<Popover
  open={open}
  onOpenChange={(next) => {
    setOpen(next);
    if (!next) setQuery("");
  }}
>
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: `Exit: 0`, no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/components/admin/products/category-tree-selector.tsx
git commit -m "feat(category-tree): add filter set computation and query state"
```

---

### Task 2: Add search input UI to the popover

**Files:**
- Modify: `apps/admin/components/admin/products/category-tree-selector.tsx`

- [ ] **Step 1: Add `Search` and `X` to the lucide imports** at the top of the file:

Replace:
```ts
import { Check, ChevronDown, ChevronRight, Folder, FolderOpen, Tag } from "lucide-react";
```
With:
```ts
import { Check, ChevronDown, ChevronRight, Folder, FolderOpen, Search, Tag, X } from "lucide-react";
```

- [ ] **Step 2: Add the search bar inside `PopoverContent`**, above the `ScrollArea`. Replace:

```tsx
      <PopoverContent
        className="p-1.5"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
        sideOffset={4}
      >
        <ScrollArea className="max-h-64">
```

With:

```tsx
      <PopoverContent
        className="p-1.5"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
        sideOffset={4}
      >
        {/* Search input */}
        <div className="relative mb-1.5">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm danh mục..."
            className="h-8 w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-7 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <ScrollArea className="max-h-64">
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: `Exit: 0`.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/admin/products/category-tree-selector.tsx
git commit -m "feat(category-tree): add search input to popover"
```

---

### Task 3: Pass filter props to `TreeNode` and render highlights

**Files:**
- Modify: `apps/admin/components/admin/products/category-tree-selector.tsx`

- [ ] **Step 1: Extend `TreeNodeProps`** to accept the new filter props. Replace the existing interface:

```ts
interface TreeNodeProps {
  node: CategoryNode;
  selectedId: string;
  onSelect: (id: string) => void;
  defaultOpen?: boolean;
}
```

With:

```ts
interface TreeNodeProps {
  node: CategoryNode;
  selectedId: string;
  onSelect: (id: string) => void;
  defaultOpen?: boolean;
  query?: string;
  matchingIds?: Set<string>;
  ancestorIds?: Set<string>;
}
```

- [ ] **Step 2: Update `TreeNode` implementation** to use the new props. Replace the full `TreeNode` function:

```tsx
function TreeNode({
  node,
  selectedId,
  onSelect,
  defaultOpen = true,
  query = "",
  matchingIds = new Set(),
  ancestorIds = new Set(),
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(defaultOpen && node.depth === 0);
  const isSelected = selectedId === node.id;

  const isSearching = query.trim().length > 0;
  const isMatch = isSearching && matchingIds.has(node.id);
  const isAncestor = isSearching && ancestorIds.has(node.id);
  const isDimmed = isSearching && !isMatch && !isAncestor;

  // When searching, force-expand ancestors of matches; collapse everything else
  const effectiveOpen = isSearching ? isAncestor : open;

  const indentClass = node.depth === 0 ? "" : node.depth === 1 ? "ml-5" : "ml-10";

  // Highlight matching substring in yellow
  function renderName(name: string) {
    if (!isMatch || !query.trim()) return name;
    const q = query.trim();
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark className="rounded-sm bg-yellow-200 px-0.5 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100">
          {name.slice(idx, idx + q.length)}
        </mark>
        {name.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren && !isSearching) setOpen((prev) => !prev);
          onSelect(node.id);
        }}
        className={cn(
          "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          indentClass,
          isSelected
            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            : isDimmed
              ? "text-slate-300 dark:text-slate-600"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        )}
      >
        {/* Chevron — hidden when dimmed during search */}
        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
          {hasChildren && !isDimmed ? (
            effectiveOpen ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </span>

        {/* Folder/tag icon */}
        <span className="flex-shrink-0">
          {hasChildren ? (
            effectiveOpen ? (
              <FolderOpen className={cn("h-4 w-4", isDimmed ? "text-slate-300 dark:text-slate-600" : "text-amber-500")} />
            ) : (
              <Folder className={cn("h-4 w-4", isDimmed ? "text-slate-300 dark:text-slate-600" : "text-amber-500")} />
            )
          ) : (
            <Tag className={cn("h-3.5 w-3.5", isDimmed ? "text-slate-300 dark:text-slate-600" : "text-slate-400")} />
          )}
        </span>

        <span className={cn("flex-1 truncate text-left", hasChildren && "font-medium")}>
          {renderName(node.name)}
        </span>

        {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
      </button>

      {hasChildren && effectiveOpen && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              defaultOpen={false}
              query={query}
              matchingIds={matchingIds}
              ancestorIds={ancestorIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Pass filter props from `CategoryTreeSelector` to the root `TreeNode` calls**. In the tree render inside `PopoverContent`, replace:

```tsx
tree.map((node) => (
  <TreeNode
    key={node.id}
    node={node}
    selectedId={value}
    onSelect={handleSelect}
    defaultOpen={true}
  />
))
```

With:

```tsx
tree.map((node) => (
  <TreeNode
    key={node.id}
    node={node}
    selectedId={value}
    onSelect={handleSelect}
    defaultOpen={true}
    query={trimmed}
    matchingIds={matchingIds}
    ancestorIds={ancestorIds}
  />
))
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: `Exit: 0`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/components/admin/products/category-tree-selector.tsx
git commit -m "feat(category-tree): filter nodes on search with highlight and auto-expand"
```
