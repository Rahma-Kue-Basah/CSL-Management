import { NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/user",
  "/schedule",
  "/room-booking",
  "/my-bookings-request",
  "/inventory",
  "/room",
  "/equipment",
  "/equipment-borrow",
  "/my-borrows-request",
];

function isProtectedPath(pathname) {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken =
    request.cookies.get("access")?.value ||
    request.cookies.get("access_token")?.value;
  if (accessToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/user/:path*",
    "/schedule/:path*",
    "/room-booking/:path*",
    "/my-bookings-request/:path*",
    "/inventory/:path*",
    "/room/:path*",
    "/equipment/:path*",
    "/equipment-borrow/:path*",
    "/my-borrows-request/:path*",
  ],
};
