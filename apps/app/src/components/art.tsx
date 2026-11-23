import { folderSvg, patternSvg, ringSvg, type FolderColor } from "@milevault/ui";
import type { Person } from "@/mock";

const img = (k: string) => `/app/images/${k.toLowerCase()}.webp`;

/** Folder illustration (exact prototype geometry) */
export function Folder({ color = "P", w = 56 }: { color?: FolderColor; w?: number }) {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: folderSvg(color, w) }} />;
}

/** 16px progress ring on project cards */
export function Ring({ frac, color }: { frac: number; color: string }) {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: ringSvg(frac, color) }} />;
}

export function Pattern() {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: patternSvg }} />;
}

/** 48px illustration tile (next-action cards, empty states) */
export function Ill({ k }: { k: string }) {
  return <div className="ill"><img src={img(k)} alt="" /></div>;
}
/** 44px balloon (review dialogs) */
export function Balloon({ k }: { k: string }) {
  return <div className="ill b44"><img src={img(k)} alt="" /></div>;
}
/** 94px slot (success pages) */
export function Slot({ k }: { k: string }) {
  return <div className="slot"><img src={img(k)} alt="" /></div>;
}

export function Avatar({ p, size = 32 }: { p: Person; size?: number }) {
  if (p.img)
    return <img className="av" src={p.imgIsData ? p.img : img(p.img)} width={size} height={size} alt="" style={{ width: size, height: size, background: p.bg }} />;
  return (
    <span className="av" style={{ width: size, height: size, background: p.bg, color: p.fg, fontSize: Math.round(size * 0.36) }}>
      {p.name.split(" ").map((w) => w[0]).join("")}
    </span>
  );
}

export const imgUrl = img;
