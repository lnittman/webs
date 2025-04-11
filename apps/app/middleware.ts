import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/signin(.*)',
  '/signup(.*)',
  '/api/webhook(.*)',
  '/_next(.*)',
  '/favicon.ico',
  '/images(.*)',
  '/share/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const pathName = url.pathname;
  
  // Protect routes that are not public
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)', 
    '/', 
    '/(api|trpc)(.*)'
  ],
};