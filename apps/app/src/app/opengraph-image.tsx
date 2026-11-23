import { ImageResponse } from "next/og";
import { ShareCard } from "@milevault/ui/og";

export const alt = "MileVault — milestone escrow payments on Stellar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(<ShareCard title="Your escrow dashboard" subtitle="Fund agreements, approve milestones and release payments — every step verifiable on Stellar." />, size);
}
