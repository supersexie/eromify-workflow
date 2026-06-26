import "@xyflow/react/dist/style.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Eromify Workflow — The Node-Based Canvas for AI Influencer Content",
  description: "Build, customize and monetize stunning AI personas. Generate images, video, voiceovers, and scripts on one infinite canvas.",
};

// Mobile foundation: render at device width (not a zoomed-out desktop width).
// viewport-fit=cover enables safe-area insets on notched phones.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  const page = (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Force the bare apex onto www before anything renders, so the page and
            its same-origin /api never split across the apex→www redirect (which
            otherwise makes server-stored data like influencers look empty). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(location.hostname==='eromify.pro'){location.replace('https://www.eromify.pro'+location.pathname+location.search+location.hash);}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
  // Only wrap with Clerk once keys exist, so the site stays up until then.
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/app"
        signUpFallbackRedirectUrl="/app"
      >
        {page}
      </ClerkProvider>
    );
  }
  return page;
}
