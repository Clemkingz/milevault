import type { Metadata, Viewport } from "next";
import { inter, openRunde } from "./fonts";
import "./globals.css";
import { SITE_URL as SITE } from "@/lib/site";

const DESCRIPTION =
  "Lock test USDC in escrow on Stellar and release each payment when the work is approved. Milestone-based escrow for clients and contributors on Stellar — MileVault never holds your keys.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "MileVault · Milestone escrow payments on Stellar", template: "%s · MileVault" },
  description: DESCRIPTION,
  applicationName: "MileVault",
  keywords: ["milestone escrow", "Stellar", "Stellar escrow", "claimable balances", "USDC", "freelance payments", "contributor payments", "Stellar Testnet"],
  authors: [{ name: "MileVault" }],
  creator: "MileVault",
  category: "finance",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "MileVault",
    title: "MileVault · Pay contributors, milestone by milestone",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MileVault · Pay contributors, milestone by milestone",
    description: "Milestone-based escrow on Stellar. Lock USDC, approve work, release payments.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = { themeColor: "#FDFDFC", width: "device-width", initialScale: 1, viewportFit: "cover" };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "MileVault",
      url: SITE,
      description: DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    { "@type": "Organization", name: "MileVault", url: SITE, logo: `${SITE}/icon.svg` },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${openRunde.variable} ${inter.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
