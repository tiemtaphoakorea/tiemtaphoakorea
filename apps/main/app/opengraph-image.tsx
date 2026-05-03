import { ImageResponse } from "next/og";

export const alt = "K-SMART - Pure Beauty";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

type BrandingConfig = { logoMainUrl?: string; ogImageUrl?: string };
type ShopInfoConfig = { name?: string; seoDescription?: string };

export default async function Image() {
  // Lazy-import DB to avoid evaluating it at build time (e.g. /_not-found prerender)
  let siteName = "K-SMART";
  let description = "Pure Beauty";
  let logoUrl: string | undefined;

  try {
    const { getSetting } = await import("@workspace/database/services/settings.server");
    const [branding, shopInfo] = await Promise.all([
      getSetting<BrandingConfig>("branding"),
      getSetting<ShopInfoConfig>("shop_info"),
    ]);
    siteName = shopInfo?.name || siteName;
    description = shopInfo?.seoDescription || description;
    logoUrl = branding?.logoMainUrl;
  } catch {
    // DB unavailable (build time) — fall back to defaults
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
        }}
      />

      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={siteName}
          width={240}
          height={80}
          style={{ objectFit: "contain", marginBottom: 32 }}
        />
      ) : (
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 24,
          }}
        >
          {siteName}
        </div>
      )}

      <div
        style={{
          width: 80,
          height: 3,
          background: "linear-gradient(90deg, #e8b4b8, #c4a4e8)",
          borderRadius: 2,
          marginBottom: 24,
        }}
      />

      <div
        style={{
          fontSize: 24,
          color: "rgba(255,255,255,0.75)",
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.5,
          letterSpacing: "0.5px",
        }}
      >
        {description}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
