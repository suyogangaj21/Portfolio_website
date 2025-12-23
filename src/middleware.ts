import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-conditions',
  '/terms&conditions',
  '/support',
  '/error'
];

// Define auth routes (routes that authenticated users shouldn't access)
const authRoutes = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/reset-password'
];

// Define API routes that should be excluded from middleware
const apiRoutes = ['/api/auth'];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname.startsWith(route));
}

function isApiRoute(pathname: string): boolean {
  return apiRoutes.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    isApiRoute(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  console.log(`Middleware: ${pathname}, Authenticated: ${isAuthenticated}`);

  // If user is authenticated
  if (isAuthenticated) {
    // Redirect authenticated users away from auth pages
    if (isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow access to all other routes for authenticated users
    return NextResponse.next();
  }

  // If user is not authenticated
  if (!isAuthenticated) {
    // Allow access to public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Redirect to sign-in for protected routes
    const signInUrl = new URL('/auth/sign-in', request.url);

    // Add redirect parameter to return user to original destination after login
    if (pathname !== '/auth/sign-in') {
      signInUrl.searchParams.set('redirect', pathname);
    }

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
