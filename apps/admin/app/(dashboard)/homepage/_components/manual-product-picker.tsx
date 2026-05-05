"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
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
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { thumbLabelFromName, thumbToneFromId } from "@/components/admin/shared/data-state";
import { ProductThumb } from "@/components/admin/shared/product-thumb";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
};

type CachedProduct = { name: string; thumbnail: string };

export function ManualProductPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 300);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const productsQuery = useInfiniteQuery({
    // "picker" suffix prevents cache collision with useQuery entries using the same base key
    queryKey: [...queryKeys.products.list(debounced, 1, 20, "all"), "picker"],
    queryFn: ({ pageParam = 1 }) =>
      adminClient.getProducts({ search: debounced || undefined, page: pageParam, limit: 20 }),
    getNextPageParam: (last) =>
      last.metadata.page < last.metadata.totalPages ? last.metadata.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
    enabled: open,
  });

  const allProducts = productsQuery.data?.pages?.flatMap((p) => p.data) ?? [];

  const [productCache, setProductCache] = useState<Record<string, CachedProduct>>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally depend on productsQuery.data to avoid allProducts reference churn
  useEffect(() => {
    if (allProducts.length === 0) return;
    setProductCache((prev) => {
      const next = { ...prev };
      for (const p of allProducts) {
        next[p.id] = { name: p.name, thumbnail: p.thumbnail };
      }
      return next;
    });
  }, [productsQuery.data]);

  function handleListScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (!productsQuery.hasNextPage || productsQuery.isFetchingNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      productsQuery.fetchNextPage();
    }
  }

  function handleToggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function handleRemove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between gap-2 overflow-hidden"
          >
            <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">
              {value.length > 0
                ? `Chọn thêm sản phẩm (${value.length} đã chọn)`
                : "Chọn sản phẩm..."}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm tên sản phẩm..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList
              onScroll={handleListScroll}
              className="max-h-80 overflow-y-auto overscroll-contain"
            >
              {productsQuery.isLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm...
                </div>
              )}
              {!productsQuery.isLoading && allProducts.length === 0 && (
                <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
              )}
              <CommandGroup>
                {allProducts.map((p) => {
                  const selected = value.includes(p.id);
                  return (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => handleToggle(p.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                        {p.thumbnail ? (
                          <Image
                            src={p.thumbnail}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 shrink-0 rounded-md border bg-muted object-contain"
                          />
                        ) : (
                          <ProductThumb
                            label={thumbLabelFromName(p.name)}
                            tone={thumbToneFromId(p.id)}
                            size={32}
                          />
                        )}
                        <span className="truncate font-medium">{p.name}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {productsQuery.isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </CommandList>
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Đã chọn {value.length} sản phẩm</span>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Xong
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="rounded-md border border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
            <span>Đã chọn {value.length} sản phẩm</span>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setConfirmClearAll(true)}
            >
              Xoá tất cả
            </button>
          </div>
          <ul className="divide-y divide-border">
            {value.map((id) => {
              const cached = productCache[id];
              const name = cached?.name ?? id;
              return (
                <li key={id} className="flex items-center gap-3 px-3 py-2">
                  {cached?.thumbnail ? (
                    <Image
                      src={cached.thumbnail}
                      alt={name}
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-md border bg-muted object-contain"
                    />
                  ) : (
                    <ProductThumb
                      label={cached ? thumbLabelFromName(cached.name) : "?"}
                      tone={thumbToneFromId(id)}
                      size={36}
                    />
                  )}
                  <span className="flex-1 truncate text-sm" title={name}>
                    {name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemove(id)}
                    aria-label="Xoá"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmClearAll}
        title="Xoá tất cả sản phẩm?"
        description={`Bạn sẽ xoá ${value.length} sản phẩm khỏi danh sách. Bạn có thể chọn lại sau.`}
        confirmLabel="Xoá tất cả"
        onConfirm={() => {
          onChange([]);
          setConfirmClearAll(false);
        }}
        onOpenChange={(o) => !o && setConfirmClearAll(false)}
      />
    </div>
  );
}
