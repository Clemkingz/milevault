import { ImageResponse } from "next/og";
import { ShareCard } from "@milevault/ui/og";

export const alt = "MileVault — Pay contributors, milestone by milestone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Twitter() {
  return new ImageResponse(<ShareCard title="Pay contributors, milestone by milestone." subtitle="Lock test USDC in a Soroban escrow and release each payment when the work is approved." />, size);
}
