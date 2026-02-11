import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getFirstRequestCookieValue,
  parseRequestCookieJson,
} from "@/lib/cookies.server";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"] as const;
const ACCESS_COOKIE_KEYS = ["access", "access_token"] as const;
const ADMIN_ROLES = new Set([
  "ADMIN",
  "SUPERADMINISTRATOR",
  "SUPER_ADMINISTRATOR",
]);

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getAccessToken(request: NextRequest): string | undefined {
  return getFirstRequestCookieValue(request, ACCESS_COOKIE_KEYS);
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function getUserRole(request: NextRequest): string | undefined {
  const profile = parseRequestCookieJson<{ role?: unknown }>(request, "profile");
  if (typeof profile?.role === "string") return profile.role;

  const user = parseRequestCookieJson<{ role?: unknown }>(request, "user");
  if (typeof user?.role === "string") return user.role;

  return undefined;
}

function hasAdminAccess(request: NextRequest): boolean {
  const role = getUserRole(request);
  if (!role) return false;
  return ADMIN_ROLES.has(String(role).trim().toUpperCase());
}

function buildLoginRedirectUrl(request: NextRequest): URL {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return loginUrl;
}

function buildUnauthorizedRedirectUrl(request: NextRequest): URL {
  const unauthorizedUrl = request.nextUrl.clone();
  unauthorizedUrl.pathname = "/dashboard";
  unauthorizedUrl.search = "";
  unauthorizedUrl.searchParams.set("from", request.nextUrl.pathname);
  return unauthorizedUrl;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (getAccessToken(request)) {
    if (isAdminPath(pathname) && !hasAdminAccess(request)) {
      return NextResponse.redirect(buildUnauthorizedRedirectUrl(request));
    }
    return NextResponse.next();
  }

  return NextResponse.redirect(buildLoginRedirectUrl(request));
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
