"use client";

import { useQuery } from "@tanstack/react-query";
import { Input } from "@workspace/ui/components/input";
import { Loader2, Package, Search, ShoppingCart, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

type ProductItem = { id: string; name: string; skus: string | null };
type OrderItem = { id: string; orderNumber: string; customer: { fullName: string } };
type CustomerItem = { id: string; fullName: string; phone: string };

type ResultGroup<T> = {
  label: string;
  icon: React.ReactNode;
  items: T[];
  isLoading: boolean;
  getHref: (item: T) => string;
  getTitle: (item: T) => string;
  getSub: (item: T) => string;
};

async function fetchSearchResults<T>(url: string, signal: AbortSignal): Promise<{ data: T[] }> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function useGlobalSearch(query: string) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;
  const params = `search=${encodeURIComponent(trimmed)}&limit=4`;

  const products = useQuery<{ data: ProductItem[] }>({
    queryKey: ["global-search", "products", trimmed],
    queryFn: ({ signal }) =>
      fetchSearchResults<ProductItem>(`/api/admin/products?${params}`, signal),
    enabled,
    staleTime: 0,
  });

  const orders = useQuery<{ data: OrderItem[] }>({
    queryKey: ["global-search", "orders", trimmed],
    queryFn: ({ signal }) => fetchSearchResults<OrderItem>(`/api/admin/orders?${params}`, signal),
    enabled,
    staleTime: 0,
  });

  const customers = useQuery<{ data: CustomerItem[] }>({
    queryKey: ["global-search", "customers", trimmed],
    queryFn: ({ signal }) =>
      fetchSearchResults<CustomerItem>(`/api/admin/customers?${params}`, signal),
    enabled,
    staleTime: 0,
  });

  return { products, orders, customers };
}

export function GlobalSearch() {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [debouncedQuery] = useDebounce(inputValue, 300);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { products, orders, customers } = useGlobalSearch(debouncedQuery);

  const groups: ResultGroup<any>[] = [
    {
      label: "Sản phẩm",
      icon: <Package className="h-3.5 w-3.5" />,
      items: products.data?.data ?? [],
      isLoading: products.isFetching,
      getHref: (p: ProductItem) => `/products/${p.id}/edit`,
      getTitle: (p: ProductItem) => p.name,
      getSub: (p: ProductItem) => p.skus ?? "",
    },
    {
      label: "Đơn hàng",
      icon: <ShoppingCart className="h-3.5 w-3.5" />,
      items: orders.data?.data ?? [],
      isLoading: orders.isFetching,
      getHref: (o: OrderItem) => `/orders/${o.id}`,
      getTitle: (o: OrderItem) => o.orderNumber,
      getSub: (o: OrderItem) => o.customer.fullName,
    },
    {
      label: "Khách hàng",
      icon: <Users className="h-3.5 w-3.5" />,
      items: customers.data?.data ?? [],
      isLoading: customers.isFetching,
      getHref: (c: CustomerItem) => `/customers/${c.id}`,
      getTitle: (c: CustomerItem) => c.fullName,
      getSub: (c: CustomerItem) => c.phone,
    },
  ];

  const allItems = groups.flatMap((g) => g.items.map((item) => ({ href: g.getHref(item) })));
  const showDropdown = open && debouncedQuery.trim().length >= 2;
  const allEmpty = groups.every((g) => !g.isLoading && g.items.length === 0);
  const anyLoading = groups.some((g) => g.isLoading);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setInputValue("");
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, []);

  // Reset active index when result count changes (prevents stale out-of-bounds index)
  useEffect(() => {
    setActiveIndex((i) => (i >= allItems.length ? -1 : i));
  }, [allItems.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setKeyboardNav(true);
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setKeyboardNav(true);
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = allItems[activeIndex];
      if (item) navigate(item.href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  let flatIndex = 0;

  return (
    <div ref={containerRef} className="relative hidden h-[34px] w-[300px] md:block">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
        strokeWidth={1.8}
      />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        placeholder="Tìm kiếm nhanh..."
        className="h-full w-full border-border bg-[#F4F5F7] pl-9 pr-3 transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus-visible:ring-0"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
          setKeyboardNav(false);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-full rounded-lg border border-border bg-white shadow-lg"
        >
          {anyLoading && allEmpty ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tìm kiếm...
            </div>
          ) : allEmpty ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Không tìm thấy kết quả</p>
          ) : (
            <div className="py-1">
              {groups.map((group) => {
                if (!group.isLoading && group.items.length === 0) return null;
                return (
                  <div key={group.label}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.icon}
                      {group.label}
                      {group.isLoading && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
                    </div>
                    {group.items.map((item) => {
                      const idx = flatIndex++;
                      const isActive = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          role="option"
                          aria-selected={isActive}
                          className={`flex w-full flex-col px-3 py-2 text-left transition-colors ${isActive ? "bg-accent" : "hover:bg-accent"}`}
                          onMouseEnter={() => {
                            if (!keyboardNav) setActiveIndex(idx);
                          }}
                          onMouseMove={() => {
                            // Re-enable mouse hover after keyboard nav when user moves mouse
                            setKeyboardNav(false);
                          }}
                          onClick={() => navigate(group.getHref(item))}
                        >
                          <span className="truncate text-[13px] font-medium">
                            {group.getTitle(item)}
                          </span>
                          {group.getSub(item) && (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {group.getSub(item)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
