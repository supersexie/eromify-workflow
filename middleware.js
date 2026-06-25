import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Gate the app + editor; the marketing site (/) and auth pages stay public.
const isProtected = createRouteMatcher(["/app(.*)", "/w(.*)", "/motion(.*)", "/image(.*)", "/video(.*)", "/upscale(.*)", "/mcp"]);

const handler = clerkMiddleware(async (auth, req) => {
  if (!isProtected(req)) return;
  const { userId } = await auth();
  if (!userId) {
    // Explicit redirect — auth.protect() can't infer our custom sign-in URL
    // from middleware (ClerkProvider props don't reach here) and 404s instead.
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
});

// Until Clerk keys are set, run a no-op so the site keeps working (app open).
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? handler : function middleware() {};

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4)).*)",
    "/(api|trpc)(.*)",
  ],
};
