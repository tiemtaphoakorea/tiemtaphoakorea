"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeaturedProduct } from "@/components/products/product-card";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

type Tile = "a" | "b" | "c" | "d" | "e" | "f";

const TILE_STYLE: Record<Tile, { bg: string; color: string; glyph: string }> = {
  a: { bg: "#EEF2FF", color: "#6366F1", glyph: "辛" },
  b: { bg: "#FEF3C7", color: "#9A3412", glyph: "美" },
  c: { bg: "#DBEAFE", color: "#3B82F6", glyph: "茶" },
  d: { bg: "#DCFCE7", color: "#15803D", glyph: "焼" },
  e: { bg: "#FEF9C3", color: "#854D0E", glyph: "糖" },
  f: { bg: "#FEE2E2", color: "#991B1B", glyph: "韓" },
};

const TILE_ORDER: Tile[] = ["a", "b", "c", "d", "e"];

function formatVnd(n: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(n))}đ`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function useCountdown(initialSeconds: number) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { h, m, s };
}

type Props = {
  products: FeaturedProduct[];
};

export function FlashSale({ products }: Props) {
  const items = products.slice(0, 5);
  const { h, m, s } = useCountdown(2 * 3600 + 14 * 60 + 37);

  if (items.length === 0) return null;

  return (
    <section className="px-4 md:container md:mx-auto md:px-4 md:py-7">
      <div
        className="relative overflow-hidden rounded-3xl border px-5 py-5 md:px-6 md:py-[22px]"
        style={{
          background: "linear-gradient(135deg,#FEF3C7 0%,#FED7AA 100%)",
          borderColor: "#FDE68A",
          color: "#9A3412",
        }}
      >
        <div className="relative z-[2] mb-4 flex flex-wrap items-center gap-3.5">
          <h2
            className="m-0 inline-flex items-center gap-2 text-[22px] font-extrabold leading-none tracking-[-0.01em]"
            style={{ color: "#9A3412" }}
          >
            <GeneratedIcon
              src={GENERATED_ICONS.flash}
              className="h-8 w-8 rounded-lg object-contain"
            />
            FLASH SALE
          </h2>
          <div className="flex items-center gap-1.5 tabular-nums">
            <small
              className="mr-1 text-xs font-medium leading-none opacity-85"
              style={{ color: "#9A3412" }}
            >
              Kết thúc sau:
            </small>
            <CountdownChip>{pad(h)}</CountdownChip>
            <span className="text-sm font-bold leading-none text-foreground">:</span>
            <CountdownChip>{pad(m)}</CountdownChip>
            <span className="text-sm font-bold leading-none text-foreground">:</span>
            <CountdownChip>{pad(s)}</CountdownChip>
          </div>
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="ml-auto rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-semibold leading-none"
            style={{ color: "#9A3412" }}
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="relative z-[2] grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-3">
          {items.map((p, i) => {
            const tile = TILE_ORDER[i % TILE_ORDER.length] ?? "a";
            const style = TILE_STYLE[tile];
            const original =
              p.originalPrice && p.originalPrice > p.price
                ? p.originalPrice
                : Math.round(p.price * 1.45);
            const discount = Math.round(100 - (p.price / original) * 100);
            const sold = (i * 23 + 38) % 200;
            const total = 200;
            const pct = Math.min(95, Math.max(20, Math.round((sold / total) * 100) + 25));
            return (
              <FlashCard
                key={p.id}
                slug={p.slug}
                title={p.name}
                price={p.price}
                original={original}
                discount={discount}
                pct={pct}
                soldLabel={pct > 90 ? "SẮP HẾT" : `ĐÃ BÁN ${sold}`}
                tile={style}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CountdownChip({ children }: { children: React.ReactNode }) {
  return (
    <b className="inline-block min-w-[30px] rounded-lg bg-foreground px-2 py-1.5 text-center text-sm font-bold leading-none text-white">
      {children}
    </b>
  );
}

function FlashCard({
  slug,
  title,
  price,
  original,
  discount,
  pct,
  soldLabel,
  tile,
}: {
  slug: string;
  title: string;
  price: number;
  original: number;
  discount: number;
  pct: number;
  soldLabel: string;
  tile: { bg: string; color: string; glyph: string };
}) {
  return (
    <Link
      href={PUBLIC_ROUTES.PRODUCT_DETAIL(slug)}
      className="relative overflow-hidden rounded-2xl border border-border bg-white text-foreground transition-all hover:shadow-md"
    >
      <div
        className="grid aspect-square place-items-center text-5xl font-black"
        style={{
          background: tile.bg,
          color: tile.color,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        {tile.glyph}
      </div>
      <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1 text-[10px] font-bold leading-none text-white">
        −{discount}%
      </span>
      <div className="px-3 pb-3 pt-2.5">
        <div className="mb-1.5 line-clamp-2 min-h-[34px] text-[12px] font-medium leading-[1.35] text-foreground">
          {title}
        </div>
        <div className="flex flex-wrap items-baseline">
          <span className="text-base font-bold tabular-nums leading-none tracking-[-0.01em] text-destructive">
            {formatVnd(price)}
          </span>
          <span className="ml-1.5 text-[11px] font-medium tabular-nums leading-none text-muted-foreground line-through">
            {formatVnd(original)}
          </span>
        </div>
        <div className="relative mt-2 h-3.5 overflow-hidden rounded-full border border-border bg-muted">
          <span
            className="absolute left-0 top-0 flex h-full items-center whitespace-nowrap rounded-full pl-2 text-[9px] font-bold uppercase leading-none tracking-[0.04em] text-white"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg,#F59E0B,#FB923C)",
            }}
          >
            {soldLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
