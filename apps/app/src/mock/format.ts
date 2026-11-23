export const fmt = (n: number) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usd = (n: number) => `${fmt(n)} USDC`;
export const num = (n: number) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
export const andList = (a: string[]) =>
  a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

/** 64-hex tx hash */
export function newHash() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
/** Design shows hashes as "5a0d…e113" */
export const shortHash = (h: string) => (h.length > 12 ? `${h.slice(0, 4)}…${h.slice(-4)}` : h);

export function relTime(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = s / 60, h = m / 60, d = h / 24, w = d / 7;
  if (m < 60) return `${Math.floor(m)}m ago`;
  if (h < 24) return `${Math.floor(h)}h ago`;
  if (d < 7) return `${Math.floor(d)}d ago`;
  if (d < 30) return `${Math.floor(w)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/** Long relative form used in "created 3 weeks ago" */
export function relLong(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  const m = s / 60, h = m / 60, d = h / 24, w = d / 7, mo = d / 30;
  const p = (n: number, u: string) => `${n} ${u}${n === 1 ? "" : "s"} ago`;
  if (s < 60) return "just now";
  if (m < 60) return p(Math.floor(m), "minute");
  if (h < 24) return p(Math.floor(h), "hour");
  if (d < 7) return p(Math.floor(d), "day");
  if (d < 30) return p(Math.floor(w), "week");
  return p(Math.max(1, Math.floor(mo)), "month");
}

export function dayGroup(iso: string, now = Date.now()): "Today" | "This week" | "Earlier" {
  const d = new Date(iso), n = new Date(now);
  if (d.toDateString() === n.toDateString()) return "Today";
  return now - d.getTime() < 7 * 864e5 ? "This week" : "Earlier";
}

export const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
export const H = 36e5, D = 864e5;
