"use client";

import type { ProductFormCategory } from "@workspace/shared/types/product";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronDown, ChevronRight, Folder, FolderOpen, Search, Tag, X } from "lucide-react";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryNode {
  id: string;
  name: string;
  depth: number;
  children: CategoryNode[];
}

// ---------------------------------------------------------------------------
// Build tree from flat array (using depth as structure cue)
// ---------------------------------------------------------------------------

function buildTree(flat: ProductFormCategory[], maxDepth = 3): CategoryNode[] {
  const roots: CategoryNode[] = [];
  const stack: CategoryNode[] = [];

  for (const cat of flat) {
    const depth = cat.depth ?? 0;
    if (depth >= maxDepth) continue;

    const node: CategoryNode = { id: cat.id, name: cat.name, depth, children: [] };

    // Pop stack until we find the parent level
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function findCategoryName(flat: ProductFormCategory[], id: string): string {
  return flat.find((c) => c.id === id)?.name ?? "";
}

const EMPTY_SET = new Set<string>();

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

// ---------------------------------------------------------------------------
// Tree Node Component
// ---------------------------------------------------------------------------

interface TreeNodeProps {
  node: CategoryNode;
  selectedId: string;
  onSelect: (id: string) => void;
  defaultOpen?: boolean;
  query?: string;
  matchingIds?: Set<string>;
  ancestorIds?: Set<string>;
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  defaultOpen = true,
  query = "",
  matchingIds = EMPTY_SET,
  ancestorIds = EMPTY_SET,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(defaultOpen && node.depth === 0);
  const isSelected = selectedId === node.id;

  const isSearching = query.length > 0;
  const isMatch = isSearching && matchingIds.has(node.id);
  const isAncestor = isSearching && ancestorIds.has(node.id);
  const isDimmed = isSearching && !isMatch && !isAncestor;

  // When searching, force-expand ancestors of matches; collapse everything else
  const effectiveOpen = isSearching ? isAncestor : open;

  const indentClass = node.depth === 0 ? "" : node.depth === 1 ? "ml-5" : "ml-10";

  // Highlight matching substring in yellow
  function renderName(name: string) {
    if (!isMatch || !query) return name;
    const q = query;
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

// ---------------------------------------------------------------------------
// Main CategoryTreeSelector Component
// ---------------------------------------------------------------------------

interface CategoryTreeSelectorProps {
  categories: ProductFormCategory[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CategoryTreeSelector({
  categories,
  value,
  onValueChange,
  placeholder = "Chọn danh mục",
}: CategoryTreeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const tree = useMemo(() => buildTree(categories), [categories]);
  const selectedName = value ? findCategoryName(categories, value) : "";

  const trimmed = query.trim();
  const { matchingIds, ancestorIds } = useMemo(
    () =>
      trimmed.length > 0
        ? computeFilterSets(tree, trimmed)
        : { matchingIds: new Set<string>(), ancestorIds: new Set<string>() },
    [tree, trimmed],
  );

  const handleSelect = (id: string) => {
    onValueChange(id);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "hover:bg-slate-50 dark:hover:bg-slate-900",
            "transition-colors",
            !selectedName && "text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedName ? (
              <>
                <Tag className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">{selectedName}</span>
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>

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
            aria-label="Tìm danh mục"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm danh mục..."
            className="h-8 w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-7 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label="Xóa tìm kiếm"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <ScrollArea className="max-h-64">
          <div className="space-y-0.5 py-0.5">
            {tree.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Không có danh mục
              </p>
            ) : (
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
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
