import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import MilaWidget from "@/components/MilaWidget";
import Analytics from "@/components/Analytics";
import SiteTracker from "@/components/SiteTracker";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
});

const body = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

const indexable = process.env.SITE_INDEXABLE === "true";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do NOT set maximumScale/userScalable=no — that harms accessibility and
  // isn't needed. The real fix for the iOS focus-zoom is 16px+ inputs (below).
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.livemodern.com"),
  title: {
    default: "LiveModern — South Florida New Construction & Modern Homes",
    template: "%s | LiveModern",
  },
  description:
    "The definitive index of South Florida's new towers and modern homes — Palm Beach to Miami, one register.",
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <MilaWidget />
        {/* First-party event stream -> /api/track -> site_events (MLG Admin). */}
        <SiteTracker />
        {/* Ad-platform tags; all env-gated, see components/Analytics.tsx. */}
        <Analytics />
      </body>
    </html>
  );
}
