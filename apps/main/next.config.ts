import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/shared", "@workspace/database"],
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
