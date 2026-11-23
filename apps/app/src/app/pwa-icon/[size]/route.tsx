import { ImageResponse } from "next/og";
import { BRAND_SKY, LOGO_MARK_PATH } from "@milevault/ui";

/** PNG app icons for the web app manifest: /app/pwa-icon/192, /512, /maskable-512 */
export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }, { size: "maskable-512" }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const maskable = raw.startsWith("maskable-");
  const size = Number(raw.replace("maskable-", "")) || 192;
  // Maskable icons need the mark inside the 80% safe zone and a full-bleed background
  const mark = Math.round(size * (maskable ? 0.42 : 0.56));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: maskable ? BRAND_SKY : "transparent" }}>
        <div style={{ width: maskable ? size : size * 0.9, height: maskable ? size : size * 0.9, borderRadius: maskable ? 0 : size * 0.22, background: BRAND_SKY, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={mark} height={mark} viewBox="0 0 24 24"><path fill="#fff" fillRule="evenodd" clipRule="evenodd" d={LOGO_MARK_PATH} /></svg>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
