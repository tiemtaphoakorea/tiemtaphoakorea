# Category Tree Selector — Inline Search Design

**Date:** 2026-04-14  
**Scope:** `apps/admin/components/admin/products/category-tree-selector.tsx`  
**Status:** Approved

---

## Problem

The current category selector renders a folder tree inside a Popover. With many categories, users must visually scan the entire tree to find what they want. There is no way to filter.

---

## Solution

Add a search input pinned at the top of the Popover. While the user types, the tree filters in place: matching nodes are highlighted, non-matching nodes fade to grey, and any parent that contains a match is automatically expanded. Clearing the input restores the original expand/collapse state.

---

## Behavior

### Default state (no query)
- Search input is empty, showing placeholder "Tìm danh mục..."
- Root nodes (depth 0) are expanded by default
- Deeper nodes follow their current toggle state

### Active search
- Match is case-insensitive substring on `name`
- **Matching nodes:** yellow highlight on the matched substring, full opacity
- **Non-matching nodes:** text fades to `text-muted-foreground` / slate-300, still rendered in place
- **Parent nodes that contain a match:** force-expanded so the match is never hidden behind a collapsed folder
- **Parent nodes with no matching descendants:** collapsed and greyed out (chevron hidden to reduce noise)
- A clear button (✕) appears inside the input when query is non-empty; clicking it resets to default state

### Selecting
- Clicking any node selects it and closes the popover — unchanged from current behavior
- Trigger button still shows the selected category name + Tag icon

---

## Component Interface

No changes to the public API of `CategoryTreeSelector`:

```ts
interface CategoryTreeSelectorProps {
  categories: ProductFormCategory[]  // flat array with depth
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}
```

All search state is local to the component (`useState`). No changes to `product-form.tsx`.

---

## Implementation Notes

- `query` state: `string`, trimmed before matching
- `matchingIds`: `Set<string>` — IDs of nodes whose name matches the query
- `ancestorIds`: `Set<string>` — IDs of nodes that are ancestors of at least one match (must be expanded)
- Both sets are derived by walking the tree on each `query` change (no memoization needed at this category count)
- `TreeNode` receives `query`, `isMatch`, and `forceExpand` props; open state is overridden when `forceExpand` is true
- When `query` is empty, `forceExpand` is never set — normal toggle state applies
- Search input uses a native `<input>` with `autoFocus` when the popover opens

---

## Files Changed

| File | Change |
|------|--------|
| `apps/admin/components/admin/products/category-tree-selector.tsx` | Add search input, filter logic, highlight rendering |

No other files change.
