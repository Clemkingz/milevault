import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { env } from "@/lib/env";
import { inter, openRunde } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`${env.siteUrl ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001")}/app`),
  title: { default: "MileVault", template: "%s · MileVault" },
  description: "Create milestone agreements, lock test USDC in escrow on Stellar, and release each payment when the work is approved.",
  applicationName: "MileVault",
  manifest: "/app/manifest.webmanifest",
  // Authenticated dashboard — keep it out of search results
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "MileVault", statusBarStyle: "default" },
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    siteName: "MileVault",
    title: "MileVault · Milestone escrow on Stellar",
    description: "Lock test USDC in escrow on Stellar and release each payment when the work is approved.",
  },
  twitter: { card: "summary_large_image", title: "MileVault · Milestone escrow on Stellar", description: "Pay contributors, milestone by milestone." },
};

export const viewport: Viewport = {
  themeColor: "#FDFDFC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${openRunde.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
