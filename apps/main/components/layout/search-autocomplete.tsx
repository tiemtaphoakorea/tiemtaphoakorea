"use client";

import type { ProductListItem } from "@workspace/database/services/product.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Input } from "@workspace/ui/components/input";
import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

type Variant = "mobile" | "desktop";

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 6;
const DEBOUNCE_MS = 250;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

type SearchListing = { products: ProductListItem[]; total: number };

export function SearchAutocomplete({ variant }: { variant: Variant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initial state empty — searchParams during SSG returns null, causing hydration mismatch
  // when URL has ?q=…. The useEffect below syncs it on the client.
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const trimmed = debouncedQuery.trim();

  // Sync input from URL when navigating between routes.
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Fetch suggestions; abort prior request and ignore stale responses.
  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/products?q=${encodeURIComponent(trimmed)}&limit=${RESULT_LIMIT}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<SearchListing>) : Promise.reject(r)))
      .then((data) => {
        setResults(data.products ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResults([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [trimmed]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const submitToResults = () => {
    const q = query.trim();
    const to = q ? `${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(q)}` : PUBLIC_ROUTES.PRODUCTS;
    setOpen(false);
    router.push(to);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitToResults();
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(value.trim().length >= MIN_QUERY_LENGTH);
  };

  const handleFocus = () => {
    if (query.trim().length >= MIN_QUERY_LENGTH) setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setOpen(false);
  };

  const showPopover = open && trimmed.length >= MIN_QUERY_LENGTH;

  return (
    <div
      ref={wrapperRef}
      className={`relative ${variant === "desktop" ? "max-w-md flex-1" : "flex-1"}`}
    >
      <form onSubmit={handleSubmit} role="search" className="flex">
        {variant === "mobile" ? (
          <div className="flex h-11 w-full items-center gap-2.5 rounded-full border border-border bg-surface px-4">
            <Input
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder="Tìm snack, mỹ phẩm, vitamin..."
              aria-label="Tìm kiếm sản phẩm"
              className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--primary-soft,#EEF2FF)] text-primary"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="group relative flex w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              type="text"
              placeholder="Tìm sản phẩm Hàn Quốc..."
              aria-label="Tìm kiếm sản phẩm"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              className="h-10 w-full rounded-full border-border bg-muted/60 pl-10 pr-4 text-sm transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/10"
            />
            {loading && (
              <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </form>

      {showPopover && (
        <div
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
        >
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tìm kiếm...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <ul className="py-2">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={PUBLIC_ROUTES.PRODUCT_DETAIL(p.slug)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/60"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-sm font-medium text-foreground">
                        {p.name}
                      </div>
                      {p.categoryName ? (
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {p.categoryName}
                        </div>
                      ) : null}
                    </div>
                    {p.minPrice > 0 ? (
                      <div className="shrink-0 text-sm font-semibold text-primary">
                        {formatPrice(p.minPrice)}
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={submitToResults}
            className="block w-full border-t border-border bg-muted/30 px-4 py-3 text-center text-xs font-semibold text-primary transition-colors hover:bg-muted/60"
          >
            Xem tất cả kết quả cho "{query.trim()}"{total > RESULT_LIMIT ? ` (${total})` : ""}
          </button>
        </div>
      )}
    </div>
  );
}
