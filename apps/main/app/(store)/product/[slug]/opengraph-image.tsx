import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

type ShopInfoConfig = { name?: string };

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Lazy-import DB to avoid evaluating it at build time
  let siteName = "K-SMART";
  let productName = "Sản phẩm";
  let productImageUrl: string | undefined;
  let description = `Mua ${productName} chính hãng tại ${siteName}`;

  try {
    const [{ getProductBySlug }, { getSetting }] = await Promise.all([
      import("@workspace/database/services/product.server"),
      import("@workspace/database/services/settings.server"),
    ]);
    const [product, shopInfo] = await Promise.all([
      getProductBySlug(slug),
      getSetting<ShopInfoConfig>("shop_info"),
    ]);
    siteName = shopInfo?.name || siteName;
    productName = product?.name || productName;
    productImageUrl = product?.variants?.[0]?.images?.[0]?.url;
    description =
      product?.description?.slice(0, 120) || `Mua ${productName} chính hãng tại ${siteName}`;
  } catch {
    // DB unavailable — fall back to defaults
  }

  const productImageData = productImageUrl
    ? await fetch(productImageUrl)
        .then((res) => res.arrayBuffer())
        .catch(() => null)
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        fontFamily: "sans-serif",
      }}
    >
      {/* Product image side */}
      <div
        style={{
          width: 560,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          flexShrink: 0,
        }}
      >
        {productImageData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImageData as unknown as string}
            alt={productName}
            style={{
              width: 480,
              height: 480,
              objectFit: "cover",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
        ) : (
          <div
            style={{
              width: 480,
              height: 480,
              borderRadius: 20,
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
            }}
          >
            🛍️
          </div>
        )}
      </div>

      {/* Content side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 56px 48px 32px",
        }}
      >
        {/* Shop name badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: "linear-gradient(90deg, #e8b4b8, #c4a4e8)",
              borderRadius: 20,
              padding: "6px 18px",
              fontSize: 14,
              fontWeight: 700,
              color: "#1a1a2e",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {siteName}
          </div>
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: productName.length > 40 ? 32 : 38,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.25,
            marginBottom: 20,
            letterSpacing: "-0.5px",
          }}
        >
          {productName}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 60,
            height: 3,
            background: "linear-gradient(90deg, #e8b4b8, #c4a4e8)",
            borderRadius: 2,
            marginBottom: 20,
          }}
        />

        {/* Description */}
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
