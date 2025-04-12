import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
} from "./constants";

/**
 * Edge-safe middleware
 * ❌ No Prisma
 * ❌ No bcrypt
 * ✅ JWT only
 */
export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const pathname = nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/multiplayer");
  // Match /auth and all /auth/* subpaths (e.g. /auth/verification, /auth/error)
  const isAuthRoute = pathname.startsWith("/auth");

  // Allow auth API routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // Protect private routes (allow auth routes for unauthenticated users - they need to access /auth to log in)
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    const authUrl = new URL("/auth", nextUrl);
    authUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
