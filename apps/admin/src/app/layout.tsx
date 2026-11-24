import type { Metadata, Viewport } from "next";
import { inter, openRunde } from "./fonts";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MileVault Admin", template: "%s · MileVault Admin" },
  description: "Operator console for MileVault milestone escrow.",
  applicationName: "MileVault Admin",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#FDFDFC", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${openRunde.variable} ${inter.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
