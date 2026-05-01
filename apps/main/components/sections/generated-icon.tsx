import Image from "next/image";

export const GENERATED_ICONS = {
  beauty: "/icons/generated/category-beauty.png",
  deal: "/icons/generated/promo-deal.png",
  delivery: "/icons/generated/service-delivery.png",
  drinks: "/icons/generated/category-drinks.png",
  flash: "/icons/generated/promo-flash.png",
  gift: "/icons/generated/category-gift.png",
  home: "/icons/generated/nav-home.png",
  homecare: "/icons/generated/category-homecare.png",
  korea: "/icons/generated/badge-korea.png",
  ramen: "/icons/generated/category-ramen.png",
  snacks: "/icons/generated/category-snacks.png",
  voucher: "/icons/generated/promo-voucher.png",
  wellness: "/icons/generated/category-wellness.png",
} as const;

type GeneratedIconProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function GeneratedIcon({ src, alt = "", className }: GeneratedIconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={96}
      height={96}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
    />
  );
}
