"use client";

import type { ProductFormCategory } from "@workspace/shared/types/product";
import { Input } from "@workspace/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronDown, Search, Tag, X } from "lucide-react";
import { useState } from "react";

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

  const selectedName = value ? (categories.find((c) => c.id === value)?.name ?? "") : "";

  const filtered = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : categories;

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
            "hover:bg-slate-50 transition-colors",
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
        <div className="relative mb-1.5">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            aria-label="Tìm danh mục"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm danh mục..."
            className="h-8 rounded-md py-1.5 pl-8 pr-7 placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus-visible:ring-0"
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
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Không có danh mục
              </p>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    value === cat.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Tag
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      value === cat.id ? "text-white" : "text-slate-400",
                    )}
                  />
                  <span className="flex-1 truncate text-left">{cat.name}</span>
                  {value === cat.id && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
