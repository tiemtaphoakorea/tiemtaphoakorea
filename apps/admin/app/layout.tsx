import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google";
import "@workspace/ui/styles/globals.css";
import { getSetting } from "@workspace/database/services/settings.server";
import { Toaster } from "@workspace/ui/components/sonner";
import { TooltipProvider } from "@workspace/ui/components/tooltip";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
});

type BrandingConfig = { faviconUrl: string; logoSquareUrl: string };
type ShopInfoConfig = { name: string };

export async function generateMetadata(): Promise<Metadata> {
  // DB calls in metadata can fail at build time (statement timeout, cold pool).
  // Fall back to defaults so prerendering doesn't crash the whole build.
  let branding: BrandingConfig | null = null;
  let shopInfo: ShopInfoConfig | null = null;
  try {
    [branding, shopInfo] = await Promise.all([
      getSetting<BrandingConfig>("branding"),
      getSetting<ShopInfoConfig>("shop_info"),
    ]);
  } catch {
    // DB unavailable (build time / timeout) — fall back to defaults
  }

  const siteName = shopInfo?.name ? `${shopInfo.name} — Admin` : "Admin CMS";
  const faviconUrl = branding?.faviconUrl || branding?.logoSquareUrl || "/favicon.ico";

  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description: "Admin management panel",
    icons: { icon: faviconUrl },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${beVietnamPro.variable} ${cormorantGaramond.variable} antialiased`}
        suppressHydrationWarning
      >
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
