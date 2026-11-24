import type { Asset, TxRef } from "./types";

/** "USDC:GBBD…" → { code: "USDC", issuer: "GBBD…" } */
export function parseAsset(id: string | null | undefined): Asset {
  if (!id || id === "XLM" || id === "native") return { id: "XLM", code: "XLM", issuer: null, native: true };
  const [code = id, issuer = null] = id.split(":");
  return { id, code, issuer, native: false };
}
export const assetCode = (id: string | null | undefined) => parseAsset(id).code;

/**
 * Decimal string → "1,500.00" by string manipulation only (no float arithmetic), per the
 * integration guide. Keeps every decimal the API sent beyond 2 (`maxDp` caps the display).
 */
export function fmtAmount(v: string | number | null | undefined, maxDp = 2) {
  let s = typeof v === "number" ? (Number.isFinite(v) ? String(v) : "0") : (v ?? "0").trim() || "0";
  if (!/^-?\d+(\.\d+)?$/.test(s)) return s;
  const neg = s.startsWith("-"); if (neg) s = s.slice(1);
  const [whole = "0", frac = ""] = s.split(".");
  const f = frac.replace(/0+$/, "").slice(0, Math.max(2, maxDp)).padEnd(2, "0");
  return `${neg ? "-" : ""}${whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${f}`;
}
/** Exact decimal strings → integer cents (BigInt) for form totals; null if not a valid amount */
export function toCents(v: string | null | undefined): bigint | null {
  const s = (v ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  return BigInt(w!) * 100n + BigInt(f.padEnd(2, "0"));
}
/** Integer cents → shortest exact decimal string ("1500", "1250.5") */
export function fromCents(c: bigint): string {
  const w = c / 100n, f = (c % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return f ? `${w}.${f}` : String(w);
}
export const money = (v: string | number | null | undefined, asset?: string | null) => `${fmtAmount(v)} ${assetCode(asset ?? "USDC")}`;

export const shortAddr = (a?: string | null) => (a && a.length > 10 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a ?? "");
export const shortHash = (h?: string | null) => (h && h.length > 12 ? `${h.slice(0, 4)}…${h.slice(-4)}` : h ?? "");

/** Tx links are `{ hash, explorerUrl }`; a bare hash string is accepted too */
export function txHash(t: TxRef | string | null | undefined): string | null {
  if (!t) return null;
  return typeof t === "string" ? t : t.hash ?? null;
}
export function txUrl(t: TxRef | string | null | undefined, explorerUrl: string): string | null {
  if (!t) return null;
  if (typeof t !== "string" && t.explorerUrl) return t.explorerUrl;
  const h = txHash(t);
  return h ? `${explorerUrl}/tx/${h}` : null;
}

export function relTime(iso?: string | null, now = Date.now()) {
  if (!iso) return "";
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  const m = s / 60, h = m / 60, d = h / 24;
  if (s < 60) return "Just now";
  if (m < 60) return `${Math.floor(m)}m ago`;
  if (h < 24) return `${Math.floor(h)}h ago`;
  if (d < 7) return `${Math.floor(d)}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
export function dayGroup(iso: string | undefined, now = Date.now()): "Today" | "This week" | "Earlier" {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  if (d.toDateString() === new Date(now).toDateString()) return "Today";
  return now - d.getTime() < 7 * 864e5 ? "This week" : "Earlier";
}

/* ---------- Stellar address validation (same check as StrKey.isValidEd25519PublicKey, no SDK) ---------- */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function crc16xmodem(bytes: Uint8Array) {
  let crc = 0;
  for (const b of bytes) { crc ^= b << 8; for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff; }
  return crc;
}
/** True for a valid `G…` account address: base32, version byte, 32-byte key and CRC16 checksum */
export function isValidPublicKey(address: string): boolean {
  if (typeof address !== "string" || address.length !== 56 || address[0] !== "G") return false;
  const out = new Uint8Array(35); let bits = 0, value = 0, n = 0;
  for (const ch of address) {
    const v = B32.indexOf(ch); if (v < 0) return false;
    value = (value << 5) | v; bits += 5;
    if (bits >= 8) { out[n++] = (value >>> (bits - 8)) & 0xff; bits -= 8; }
  }
  if (n !== 35 || (value & ((1 << bits) - 1)) !== 0 || out[0] !== 6 << 3) return false;
  const crc = crc16xmodem(out.subarray(0, 33));
  return out[33] === (crc & 0xff) && out[34] === crc >> 8;
}
