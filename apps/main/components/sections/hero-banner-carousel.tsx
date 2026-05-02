"use client";

import type { BannerSlide } from "@workspace/database/services/banner.server";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTOPLAY_INTERVAL = 5000;
const HERO_FALLBACK_IMAGES = [
  "/banners/k-smart-hero-fallback.png",
  "/banners/k-smart-hero-skincare.png",
  "/banners/k-smart-hero-snacks.png",
  "/banners/k-smart-hero-homecare.png",
  "/banners/k-smart-hero-wellness.png",
];

const ACCENT_COLOR_MAP: Record<string, string> = {
  violet: "from-violet-600/80 via-black/40 to-transparent",
  blue: "from-blue-700/80 via-black/40 to-transparent",
  rose: "from-rose-600/80 via-black/40 to-transparent",
  orange: "from-orange-600/80 via-black/40 to-transparent",
  green: "from-green-700/80 via-black/40 to-transparent",
  sky: "from-sky-600/80 via-black/40 to-transparent",
  pink: "from-pink-600/80 via-black/40 to-transparent",
  default: "from-black/80 via-black/40 to-transparent",
};

function getAccentGradient(color: string | null | undefined): string {
  if (!color) return ACCENT_COLOR_MAP.default;
  return ACCENT_COLOR_MAP[color] ?? ACCENT_COLOR_MAP.default;
}

type Props = {
  slides: BannerSlide[];
  heightClass?: string;
};

export function HeroBannerCarousel({
  slides,
  heightClass = "h-[320px] md:h-[460px] lg:h-[560px]",
}: Props) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = slides.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setTimeout(next, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, next, total]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  if (total === 0) return null;

  const slide = slides[current];

  const titleLines = slide.title.split("\n");

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className={`relative ${heightClass}`}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
            aria-hidden={i !== current}
          >
            <Image
              src={
                s.imageUrl && !failedImageUrls[s.imageUrl]
                  ? s.imageUrl
                  : HERO_FALLBACK_IMAGES[i % HERO_FALLBACK_IMAGES.length]
              }
              alt={s.title}
              fill
              className="object-cover"
              sizes="(max-width: 1536px) calc(100vw - 2rem), 1504px"
              priority={i === 0}
              onError={() => {
                if (s.imageUrl) {
                  setFailedImageUrls((currentFailed) => ({ ...currentFailed, [s.imageUrl]: true }));
                }
              }}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-r ${getAccentGradient(s.accentColor)}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content — always on top */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="max-w-xl space-y-5 px-8 md:px-14">
            {/* Badge */}
            {slide.badgeText && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-yellow-300" />
                <span className="text-xs font-semibold text-white/90">{slide.badgeText}</span>
              </div>
            )}

            {/* Headline */}
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow md:text-6xl lg:text-7xl">
              {titleLines.map((line, i) => (
                <span key={i}>
                  {i === 1 ? <span className="text-violet-300">{line}</span> : line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            {slide.subtitle && (
              <p className="text-sm font-medium text-white/80 md:text-base">{slide.subtitle}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {slide.ctaLabel && slide.ctaUrl && (
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-primary px-8 text-sm font-bold shadow-lg shadow-primary/40 transition-all hover:bg-primary/90 hover:shadow-primary/60"
                  asChild
                >
                  <Link href={slide.ctaUrl}>
                    {slide.ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {slide.ctaSecondaryLabel && (
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-full border border-white/30 bg-white/10 px-8 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                >
                  {slide.ctaSecondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Discount tag */}
        {slide.discountTag && (
          <div className="absolute right-6 top-6 z-10 hidden md:block">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Ưu đãi</p>
              <p className="font-display text-3xl font-extrabold text-white">{slide.discountTag}</p>
              {slide.discountTagSub && (
                <p className="text-xs text-white/70">{slide.discountTagSub}</p>
              )}
            </div>
          </div>
        )}

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Slide trước"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Slide tiếp theo"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Chuyển sang slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  i === current ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
