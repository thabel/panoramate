import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/tours',
    '/api/billing/webhook',
    '/tour/',
  ];

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === '/'
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - check authentication
  const token = request.cookies.get('token')?.value;
  const authHeader = request.headers.get('authorization');

  let tokenToVerify = token;
  if (authHeader?.startsWith('Bearer ')) {
    tokenToVerify = authHeader.slice(7);
  }

  if (!tokenToVerify) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyJWT(tokenToVerify);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Token is valid, continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/tours/:path*',
  
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _next/webpack-hmr (Hot Reloading)
     */
     '/((?!_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)',
  ],
};
