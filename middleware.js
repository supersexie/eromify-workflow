import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const PROTECTED = [
  "/app",
  "/w",
  "/motion",
  "/image",
  "/video",
  "/upscale",
  "/library",
  "/influencers",
  "/mcp",
];

function isProtected(pathname) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Force the bare apex onto www so the page and its /api calls share one origin.
// Without this, the page loads on magicmint.pro but /api cross-redirects to
// www.magicmint.pro → the browser can't read the response (CORS) → influencers
// look empty. We skip /api so the existing MCP connector URL keeps working.
function canonicalHost(req) {
  const host = req.headers.get("host") || "";
  if (host === "magicmint.pro" && !req.nextUrl.pathname.startsWith("/api")) {
    const url = req.nextUrl.clone();
    url.host = "www.magicmint.pro";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  return null;
}

const authEnabled = !!(
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET &&
  process.env.AUTH_SECRET
);

const { auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || "dev-placeholder-not-for-production",
  providers: [],
});

function openMiddleware(req) {
  return canonicalHost(req) || NextResponse.next();
}

const gatedMiddleware = auth((req) => {
  const canon = canonicalHost(req);
  if (canon) return canon;

  if (isProtected(req.nextUrl.pathname) && !req.auth) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

// Until Google OAuth keys are set, only run the canonical-host redirect.
export default authEnabled ? gatedMiddleware : openMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4)).*)",
    "/(api|trpc)(.*)",
  ],
};
