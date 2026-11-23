export const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usd = (n: number) => `${fmt(n)} USDC`;
export const compact = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : fmt(n);
export const short = (a: string) => (a.length > 8 ? `${a.slice(0, 1)}…${a.slice(-3)}` : a);
export const mid = (a: string) => (a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);
export const shortHash = (h: string) => `${h.slice(0, 4)}…${h.slice(-4)}`;
export function relTime(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  const m = s / 60, h = m / 60, d = h / 24;
  if (s < 60) return "Just now";
  if (m < 60) return `${Math.floor(m)}m ago`;
  if (h < 24) return `${Math.floor(h)}h ago`;
  if (d < 30) return `${Math.floor(d)}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
