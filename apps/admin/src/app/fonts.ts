import localFont from "next/font/local";
import { Inter } from "next/font/google";

/** Open Runde (SIL OFL 1.1) — app UI typeface from the design guide */
export const openRunde = localFont({
  variable: "--font-open-runde",
  display: "swap",
  src: [
    { path: "../fonts/OpenRunde-Regular.woff2", weight: "400" },
    { path: "../fonts/OpenRunde-Medium.woff2", weight: "500" },
    { path: "../fonts/OpenRunde-Semibold.woff2", weight: "600" },
  ],
});

/** Inter — addresses, timestamps, marketing copy */
export const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter-face" });
