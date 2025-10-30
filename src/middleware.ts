import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware to show the maintenance page across the site when MAINTENANCE_MODE is enabled.
export function middleware(req: NextRequest) {
  const MAINTENANCE =
    process.env.MAINTENANCE_MODE === "true" || process.env.MAINTENANCE_MODE === "1";

  if (!MAINTENANCE) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // Allow the maintenance page itself, Next.js assets, API routes, and static files
  const isAllowed =
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("."); // static assets like /primary-logo.png, /manifest.json

  if (isAllowed) {
    return NextResponse.next();
  }

  // Rewrite all other routes to the maintenance page
  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.rewrite(url);
}

// Run middleware for all routes except Next internals, the maintenance page itself, and static files
export const config = {
  matcher: ["/((?!_next|api|maintenance|.*\\..*).*)"],
};