"use client";

import type { CategoryCardItem } from "@workspace/database/services/categoryCard.server";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  cards: CategoryCardItem[];
};

export function CategoryCardsGrid({ cards }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <CategoryCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function CategoryCard({ card }: { card: CategoryCardItem }) {
  return (
    <Link href={card.linkUrl} className="group block cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800" />
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${card.accentColor ?? "from-primary/70"} via-black/20 to-transparent`}
        />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {card.countText && (
            <span className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
              {card.countText}
            </span>
          )}
          <h3 className="text-sm font-bold text-white md:text-base">{card.title}</h3>
          <span className="mt-1.5 inline-flex translate-x-0 items-center gap-1 text-xs font-semibold text-white/80 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
            Xem thêm <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
