import { ImageResponse } from "next/og";
import { AppleIcon } from "@milevault/ui/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppleIcon />, size);
}
