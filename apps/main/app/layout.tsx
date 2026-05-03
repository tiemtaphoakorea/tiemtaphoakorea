import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Syne } from "next/font/google";
import "@workspace/ui/styles/globals.css";
import { getSetting } from "@workspace/database/services/settings.server";
import { Toaster } from "@workspace/ui/components/sonner";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

type BrandingConfig = {
  logoMainUrl: string;
  logoSquareUrl: string;
  faviconUrl: string;
  appleIconUrl: string;
  ogImageUrl: string;
};

type ShopInfoConfig = {
  name: string;
  seoDescription: string;
  seoKeywords: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const [branding, shopInfo] = await Promise.all([
    getSetting<BrandingConfig>("branding"),
    getSetting<ShopInfoConfig>("shop_info"),
  ]);

  const siteName = shopInfo?.name || "K-SMART";
  const description = shopInfo?.seoDescription || "K-SMART Pure Beauty";
  const faviconUrl = branding?.faviconUrl || branding?.logoSquareUrl || "/favicon.ico";
  const appleIconUrl = branding?.appleIconUrl || branding?.logoSquareUrl || "/apple-icon.png";
  const ogImageUrl = branding?.ogImageUrl;

  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    keywords: shopInfo?.seoKeywords || undefined,
    openGraph: {
      title: siteName,
      description,
      siteName,
      type: "website",
      ...(ogImageUrl && { images: [{ url: ogImageUrl, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
    icons: {
      icon: faviconUrl,
      apple: appleIconUrl,
    },
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
        className={`${beVietnamPro.variable} ${syne.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
