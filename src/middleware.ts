import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  console.log("MIDDLEWARE:", request.nextUrl.pathname);
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/billing/webhook",
    "/api/tours-public",
    "/api/inscription-request",
    "/api/admin/create-user",
    "/tour/",
    "/login",
    "/register",
    "/request-inscription",
  ];

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === "/",
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - check authentication
  const token = request.cookies.get("token")?.value;
  console.log("Middleware - token from cookies:", token);
  const authHeader = request.headers.get("authorization");
  console.log("Middleware - Authorization header:", authHeader);
  let tokenToVerify = token;
  if (authHeader?.startsWith("Bearer ")) {
    tokenToVerify = authHeader.slice(7);
  }

  if (!tokenToVerify) {
    // Redirect to login if it's a page request, otherwise return JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("No token found in cookies or Authorization header");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyJWT(tokenToVerify);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Token is valid, continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/tours/:path*",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _next/webpack-hmr (Hot Reloading)
     */
    "/((?!_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)",
  ],
};
