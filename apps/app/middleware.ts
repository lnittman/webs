import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    // Match any URL with 'continue' or 'verification' in it
    '/(.*continue.*)',
    '/(.*verification.*)',
    '/signup/(.*)' // Match all signup subpaths except the main signup
  ],
};

export function middleware(req: NextRequest) {
  console.log('[Middleware] Request path:', req.nextUrl.pathname);
  
  // Allow main signup page
  if (req.nextUrl.pathname === '/signup') {
    return NextResponse.next();
  }
  
  // Special handling for different paths
  if (req.nextUrl.pathname.includes('/continue') || 
      req.nextUrl.pathname.includes('/verification') ||
      req.nextUrl.pathname.startsWith('/signup/')) {
    console.log('[Middleware] Redirecting auth flow path to home page');
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  return NextResponse.next();
} 