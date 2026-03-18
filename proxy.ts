import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROOT_DOMAIN } from "./lib/constants";

const rootDomain = ROOT_DOMAIN;

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  // Local development environment
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes(".localhost")) {
      return hostname.split(".")[0];
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(":")[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
    const parts = hostname.split("---");
    return parts.length > 0 ? parts[0] : null;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, "") : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  if (subdomain === "admin") {
    const targetPath =
      pathname === "/"
        ? "/admin"
        : pathname.startsWith("/admin")
          ? pathname
          : `/admin${pathname}`;

    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // When accessing /admin directly on the root domain (no subdomain),
  // treat it as a non-existent route and show the global 404 page.
  if (!subdomain && pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api|_next|[\\w-]+\\.\\w+).*)",
  ],
};
