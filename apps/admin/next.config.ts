import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Load root .env for monorepo — runs before Next.js processes env files,
// so NEXT_PUBLIC_* vars are available at build time.
config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/shared", "@workspace/database"],
  serverExternalPackages: ["jspdf", "jspdf-autotable"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "example.com", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "ecimg.cafe24img.com", pathname: "/**" },
      { protocol: "https", hostname: "sapo.dktcdn.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
