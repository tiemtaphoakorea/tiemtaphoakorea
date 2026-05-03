import { getCategories } from "@workspace/database/services/category.server";
import { getFeaturedProductsByRootCategoryIds } from "@workspace/database/services/product.server";
import { getSetting } from "@workspace/database/services/settings.server";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Navbar } from "@/components/layout/navbar";
import { NewsletterCta } from "@/components/sections/newsletter-cta";
import { ChatWidgetInitializer } from "@/components/store/chat-widget-initializer";

// Layout fetches DB-backed nav/footer/branding on every render. Prerendering
// children in parallel exhausts the Postgres pool (max=10) and trips Next.js
// 60s static timeout. Match the existing per-page force-dynamic pattern
// (homepage, products, OG images) at the layout level.
export const dynamic = "force-dynamic";

type ContactWidgetConfig = { messengerUrl?: string };
type ShopInfoConfig = { phone?: string };
type FooterConfig = {
  tagline?: string;
  hq?: string;
  office?: string;
  officeDetail?: string;
  copyright?: string;
};
type SocialConfig = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
};
type BrandingConfig = { logoMainUrl?: string };

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [
    allCategories,
    navCategories,
    contactConfig,
    footerConfig,
    socialConfig,
    shopInfo,
    branding,
  ] = await Promise.all([
    getCategories(),
    getCategories({ navOnly: true }),
    getSetting<ContactWidgetConfig>("contact_widget_config"),
    getSetting<FooterConfig>("footer_config"),
    getSetting<SocialConfig>("social_config"),
    getSetting<ShopInfoConfig>("shop_info"),
    getSetting<BrandingConfig>("branding"),
  ]);

  const categories = allCategories.filter((c) => c.isActive);

  const leafNavRootIds = navCategories
    .filter((c) => !c.children || c.children.length === 0)
    .map((c) => c.id);
  const featuredByCategory =
    leafNavRootIds.length > 0 ? await getFeaturedProductsByRootCategoryIds(leafNavRootIds, 6) : {};

  return (
    <div className="bg-background flex min-h-screen flex-col font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar
        categories={categories}
        navCategories={navCategories}
        featuredByCategory={featuredByCategory}
        logoUrl={branding?.logoMainUrl}
      />
      <main className="w-full flex-1 pb-20 md:pb-0">{children}</main>
      <NewsletterCta />
      <Footer footer={footerConfig ?? {}} social={socialConfig ?? {}} />
      <MobileBottomNav />
      <ChatWidgetInitializer
        phoneNumber={shopInfo?.phone}
        messengerUrl={contactConfig?.messengerUrl}
      />
    </div>
  );
}
