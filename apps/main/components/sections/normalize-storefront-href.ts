import { PUBLIC_ROUTES } from "@workspace/shared/routes";

export function normalizeStorefrontHref(href: string | null | undefined): string {
  if (!href) return PUBLIC_ROUTES.PRODUCTS;
  return href.replace(/^\/products(?=\/|\?|$)/, PUBLIC_ROUTES.PRODUCTS);
}
