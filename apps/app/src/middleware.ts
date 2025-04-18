import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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

// Define API routes pattern
const isApiRoute = createRouteMatcher([
  '/api/(.*)'
]);

export default clerkMiddleware(
  async (auth, req) => {
    const url = req.nextUrl;
    const pathName = url.pathname;
    
    // For debugging
    console.log(`Processing request: ${pathName}`);
    if (req.headers.get('authorization')) {
      console.log(`Auth header exists for ${pathName}`);
    } else {
      console.log(`No auth header for ${pathName}`);
    }
    
    // For API routes, we need to validate the token but handle errors differently
    if (isApiRoute(req)) {
      try {
        const authObject = await auth();
        
        // If no user is authenticated for API routes, return 401
        if (!authObject.userId) {
          console.log(`Auth failed for ${pathName} - no userId in token`);
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            }
          });
        }
        
        // Continue with the request if authenticated
        console.log(`Auth successful for ${pathName} - userId: ${authObject.userId}`);
        return;
      } catch (error) {
        console.error(`Auth error for ${pathName}:`, error);
        return new Response(JSON.stringify({ error: 'Authentication failed' }), { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
    }
    
    // For non-API routes, protect if not public
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  { debug: false } // Enable Clerk debug mode
);

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)', 
    '/', 
    '/(api|trpc)(.*)'
  ],
};