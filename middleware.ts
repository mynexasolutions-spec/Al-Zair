import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getAdminSession(request: NextRequest): boolean {
  const sessionCookie =
    request.cookies.get('alzair_admin_session') || request.cookies.get('syab_admin_session');

  if (!sessionCookie || !sessionCookie.value) return false;

  try {
    const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
    return Boolean(parsed && (parsed.email || parsed.role));
  } catch {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      return Boolean(parsed && (parsed.email || parsed.role));
    } catch {
      return false;
    }
  }
}

function getCustomerSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('alzair_customer_session');

  if (!sessionCookie || !sessionCookie.value) return false;

  try {
    const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
    return Boolean(parsed && (parsed.email || parsed.id));
  } catch {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      return Boolean(parsed && (parsed.email || parsed.id));
    } catch {
      return false;
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const isAdminAuthenticated = getAdminSession(request);
  const isCustomerAuthenticated = getCustomerSession(request);

  // 1. ==================== ADMIN UI ROUTE PROTECTION ====================
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';

    // Unauthenticated user trying to access protected admin pages -> Redirect to Admin Login
    if (!isAdminAuthenticated && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated admin trying to visit /admin/login -> Redirect to Dashboard
    if (isAdminAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // 2. ==================== ADMIN API ROUTE PROTECTION ====================
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    if (!isAdminAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin authentication session is missing or invalid.' },
        { status: 401 }
      );
    }
  }

  // 3. ==================== CUSTOMER ACCOUNT & CART UI PROTECTION ====================
  if (pathname.startsWith('/account') || pathname === '/cart') {
    // Unauthenticated visitor trying to access account dashboard or cart -> Redirect to User Login
    if (!isCustomerAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. ==================== CUSTOMER AUTH PAGES (LOGIN / SIGNUP) ====================
  if (pathname === '/login' || pathname === '/signup') {
    // If customer is already authenticated, redirect to /account or their target redirect URL
    if (isCustomerAuthenticated) {
      const redirectTo = searchParams.get('redirect') || searchParams.get('from') || '/account';
      const destination = redirectTo.startsWith('/') ? redirectTo : '/account';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  // 5. ==================== CUSTOMER PROTECTED APIS ====================
  if (pathname.startsWith('/api/account') || pathname === '/api/auth/profile') {
    if (!isCustomerAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Customer login session is required.' },
        { status: 401 }
      );
    }
  }

  // 6. ==================== GLOBAL SECURITY HEADERS ====================
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all admin routes, customer accounts, cart, auth routes, and protected APIs
     */
    '/admin/:path*',
    '/api/admin/:path*',
    '/account/:path*',
    '/cart',
    '/api/account/:path*',
    '/api/auth/profile',
    '/login',
    '/signup',
  ],
};
