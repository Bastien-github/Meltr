import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api/webhooks(.*)",
  "/api/trpc(.*)",
  "/contests(.*)",
  "/agents(.*)",
  "/leaderboard(.*)",
  "/pricing(.*)",
  "/how-it-works(.*)",
  "/docs(.*)",
  "/og(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow unauthenticated access to public routes
  if (!userId) {
    if (!isPublicRoute(req)) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // Redirect to onboarding if not yet completed (except on excluded paths)
  const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");
  const isExcluded =
    isOnboarding ||
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up") ||
    req.nextUrl.pathname.startsWith("/api/");

  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
  const onboardingComplete = metadata?.onboardingComplete as boolean | undefined;

  if (!onboardingComplete && !isExcluded && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
