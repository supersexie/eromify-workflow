import "@xyflow/react/dist/style.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Eromify Workflow — The Node-Based Canvas for AI Influencer Content",
  description: "Build, customize and monetize stunning AI personas. Generate images, video, voiceovers, and scripts on one infinite canvas.",
};

export default function RootLayout({ children }) {
  const page = (
    <html lang="en" suppressHydrationWarning>
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
