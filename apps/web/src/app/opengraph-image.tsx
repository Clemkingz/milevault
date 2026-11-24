import { ImageResponse } from "next/og";
import { ShareCard } from "@milevault/ui/og";

export const alt = "MileVault — Pay contributors, milestone by milestone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(<ShareCard title="Pay contributors, milestone by milestone." subtitle="Lock test USDC in escrow on Stellar and release each payment when the work is approved." />, size);
}
