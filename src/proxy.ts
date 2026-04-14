import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session_token")?.value;

  // Protected routes — require session
  const protectedPaths = [
    /^\/articolo\/[^/]+\/edit$/,
    /^\/dashboard/,
    /^\/crea/,
  ];

  const isProtected = protectedPaths.some((re) => re.test(pathname));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/articolo/:slug/edit", "/dashboard/:path*", "/crea/:path*"],
};
