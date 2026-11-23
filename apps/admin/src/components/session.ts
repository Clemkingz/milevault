"use client";

import { useSyncExternalStore } from "react";

/**
 * Operator session (MOCK). In production the external backend authenticates operators
 * (e.g. wallet signature against an allowlist) — replace `signIn` with that flow.
 */
const KEY = "milevault-admin";
const subs = new Set<() => void>();
const read = () => (typeof window === "undefined" ? null : localStorage.getItem(KEY));
export function useOperator() {
  const v = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => "ssr");
  return { ready: v !== "ssr", operator: v && v !== "ssr" ? (JSON.parse(v) as { name: string; since: string }) : null };
}
export function signIn() { localStorage.setItem(KEY, JSON.stringify({ name: "Demo operator", since: new Date().toISOString() })); subs.forEach((f) => f()); }
export function signOut() { localStorage.removeItem(KEY); subs.forEach((f) => f()); }
