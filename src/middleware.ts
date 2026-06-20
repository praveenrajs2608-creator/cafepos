import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

/** Where each role should go after login (or when hitting a forbidden route) */
function roleHome(role: string): string {
  if (role === 'ADMIN') return '/dashboard';
  if (role === 'KITCHEN') return '/kds';
  if (role === 'CUSTOMER') return '/customer-dashboard';
  return '/pos'; // CASHIER default
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // ---- path classification ----
  const isAdminPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/floors-tables') ||
    pathname.startsWith('/payment-methods') ||
    pathname.startsWith('/coupons-promotions') ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/self-ordering') ||
    pathname.startsWith('/reports');

  const isPOSPath =
    pathname.startsWith('/pos') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/tables') ||
    pathname.startsWith('/customers');

  const isKDSPath = pathname === '/kds' || pathname.startsWith('/kds/');

  const isProtected = isAdminPath || isPOSPath || isKDSPath;

  if (!isProtected) return NextResponse.next();

  // ---- unauthenticated → /login?redirect=pathname ----
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = verifyJWT(token);
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role } = session;

  // ---- role permission checks → redirect to own home if wrong role ----
  if (isAdminPath && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  if (isPOSPath && role !== 'CASHIER' && role !== 'ADMIN') {
    // KITCHEN trying to access POS → send to KDS
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  if (isKDSPath && role !== 'KITCHEN' && role !== 'ADMIN') {
    // CASHIER trying to access KDS → send to POS
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/categories/:path*',
    '/users/:path*',
    '/floors-tables/:path*',
    '/payment-methods/:path*',
    '/coupons-promotions/:path*',
    '/booking/:path*',
    '/self-ordering/:path*',
    '/reports/:path*',
    '/pos/:path*',
    '/pos',
    '/orders/:path*',
    '/tables/:path*',
    '/customers/:path*',
    '/kds',
    '/kds/:path*',
  ],
};
