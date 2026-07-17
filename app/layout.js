import "@xyflow/react/dist/style.css";
import "./globals.css";
import "./site.css";
import Providers from "@/components/Providers";
import TosGate from "@/components/TosGate";

export const metadata = {
  title: "Magic Mint — The Node-Based Canvas for AI Influencer Content",
  description: "Build, customize and monetize stunning AI personas. Generate images, video, voiceovers, and scripts on one infinite canvas.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

// Mobile foundation: render at device width (not a zoomed-out desktop width).
// viewport-fit=cover enables safe-area insets on notched phones.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Force the bare apex onto www before anything renders, so the page and
            its same-origin /api never split across the apex→www redirect (which
            otherwise makes server-stored data like influencers look empty). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(location.hostname==='magicmint.pro'){location.replace('https://www.magicmint.pro'+location.pathname+location.search+location.hash);}",
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <TosGate />
        </Providers>
      </body>
    </html>
  );
}
