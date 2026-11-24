"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const PAGE_SIZE = 20;

/** List state (filters, search, page) kept in the URL so views are shareable and survive reloads. */
export function useListParams<K extends string>(keys: K[]) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = (k: string) => sp.get(k) ?? "";
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const set = (patch: Partial<Record<K | "search" | "page", string | number | null>>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === "" || v === undefined) next.delete(k); else next.set(k, String(v)); }
    if (!("page" in patch)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const filters = Object.fromEntries(keys.map((k) => [k, get(k)])) as Record<K, string>;
  const search = get("search");
  const [q, setQ] = useState(search);
  useEffect(() => { const t = setTimeout(() => { if (q.trim() !== search) set({ search: q.trim() } as never); }, 350); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return { filters, search, q, setQ, page, set, offset: (page - 1) * PAGE_SIZE };
}
