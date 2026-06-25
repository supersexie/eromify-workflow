import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Gate the app + editor; the marketing site (/) and auth pages stay public.
const isProtected = createRouteMatcher(["/app(.*)", "/w(.*)", "/motion(.*)", "/image(.*)", "/video(.*)", "/upscale(.*)", "/library(.*)", "/influencers(.*)", "/mcp"]);

// Force the bare apex onto www so the page and its /api calls share one origin.
// Without this, the page loads on eromify.pro but /api cross-redirects to
// www.eromify.pro → the browser can't read the response (CORS) → influencers
// look empty. We skip /api so the existing MCP connector URL keeps working.
function canonicalHost(req) {
  const host = req.headers.get("host") || "";
  if (host === "eromify.pro" && !req.nextUrl.pathname.startsWith("/api")) {
    const url = req.nextUrl.clone();
    url.host = "www.eromify.pro";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  return null;
}

const handler = clerkMiddleware(async (auth, req) => {
  const canon = canonicalHost(req);
  if (canon) return canon;
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

// Until Clerk keys are set, run the canonical-host redirect standalone so the
// www consolidation still works with the open app.
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? handler
  : function middleware(req) { return canonicalHost(req) || NextResponse.next(); };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4)).*)",
    "/(api|trpc)(.*)",
  ],
};
