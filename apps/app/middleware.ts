import { authMiddleware } from "@repo/auth/middleware";

// This example protects all routes including api/trpc routes
export default authMiddleware({
  publicRoutes: ["/", "/signin(.*)", "/signup(.*)"]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 