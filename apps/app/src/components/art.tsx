import { folderSvg, patternSvg, ringSvg, type FolderColor } from "@milevault/ui";
import { avatarFor } from "@/lib/domain";

const img = (k: string) => `/app/images/${k.toLowerCase()}.webp`;

export function Folder({ color = "P", w = 56 }: { color?: FolderColor; w?: number }) {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: folderSvg(color, w) }} />;
}
export function Ring({ frac, color }: { frac: number; color: string }) {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: ringSvg(frac, color) }} />;
}
export function Pattern() {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: patternSvg }} />;
}
export function Ill({ k }: { k: string }) { return <div className="ill"><img src={img(k)} alt="" /></div>; }
export function Slot({ k }: { k: string }) { return <div className="slot"><img src={img(k)} alt="" /></div>; }

/** Wallet avatar: deterministic colour + characters from the address (no profiles) */
export function Avatar({ address, size = 32 }: { address: string; size?: number }) {
  const { bg, fg, initials } = avatarFor(address || "G?");
  return <span className="av" aria-hidden style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.34), fontFamily: "var(--inter)" }}>{initials}</span>;
}

export const imgUrl = img;
