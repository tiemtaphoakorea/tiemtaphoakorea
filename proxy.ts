import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  console.log("Proxy Request:", { url: url.pathname, hostname });

  // Check if we are on the admin subdomain
  // Adjust logic as needed for your environment (e.g. localhost vs production)
  const isAdminSubdomain = hostname.startsWith("admin.");

  if (isAdminSubdomain) {
    // Rewrite requests to /admin folder
    // But preserve API routes if they are global
    if (!url.pathname.startsWith("/api") && !url.pathname.startsWith("/_next")) {
      const newUrl = new URL(url);
      newUrl.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
      console.log(`[Proxy] Rewriting ${url.pathname} to ${newUrl.pathname}`);

      return NextResponse.rewrite(newUrl);
    }
  } else {
    // Optional: Redirect /admin on main domain to subdomain
    if (url.pathname.startsWith("/admin")) {
      const newUrl = new URL(url);
      newUrl.hostname = `admin.${newUrl.hostname}`;
      newUrl.pathname = url.pathname.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(newUrl);
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
