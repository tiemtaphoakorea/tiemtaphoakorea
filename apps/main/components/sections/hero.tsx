"use server";

import { getBanners } from "@workspace/database/services/banner.server";
import { HeroBannerCarousel } from "./hero-banner-carousel";
import { HeroEmpty } from "./hero-empty";

export async function Hero() {
  const allSlides = await getBanners().catch(() => []);
  const slides = allSlides.filter((s) => s.imageUrl);

  return (
    <section className="bg-background pb-3 pt-3 md:pb-6 md:pt-6">
      <div className="container mx-auto px-4">
        {slides.length > 0 ? <HeroBannerCarousel slides={slides} /> : <HeroEmpty />}
      </div>
    </section>
  );
}
