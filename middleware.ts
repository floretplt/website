import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/en" ? "/" : pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  // Include `/` explicitly so the locale middleware runs on the homepage (not only on nested paths).
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
