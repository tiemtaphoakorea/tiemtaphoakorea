import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const FALLBACK_IMAGE = "/banners/k-smart-hero-fallback.png";

type HeroEmptyProps = {
  heightClass?: string;
};

/** Neutral hero banner shown when DB has no active banners. No marketing copy. */
export function HeroEmpty({ heightClass = "h-[320px] md:h-[460px] lg:h-[560px]" }: HeroEmptyProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${heightClass}`}>
      <Image
        src={FALLBACK_IMAGE}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1536px) calc(100vw - 2rem), 1504px"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="max-w-[18rem] space-y-4 px-8 sm:max-w-xl sm:space-y-5 md:px-14">
          <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-4xl md:text-5xl">
            Khám phá sản phẩm
          </h1>
          <Button
            size="lg"
            className="h-11 rounded-full bg-primary px-6 text-sm font-bold shadow-lg shadow-primary/40 hover:bg-primary/90 sm:h-12 sm:px-8"
            asChild
          >
            <Link href={PUBLIC_ROUTES.PRODUCTS}>
              Xem tất cả <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
