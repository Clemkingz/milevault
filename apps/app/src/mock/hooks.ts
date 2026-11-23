"use client";

import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { describe } from "./activity";
import { getPerson } from "./people";
import { useChain } from "./store";
import { involves } from "./selectors";
import type { MockAgreement, MockEvent, PersonKey } from "./types";

/**
 * Client-side boot: rehydrate the persisted demo chain, then hold for a short
 * simulated "network read" so loading states are exercised like a real backend.
 */
const useBoot = create<{ hydrated: boolean; ready: boolean }>(() => ({ hydrated: false, ready: false }));
let booted = false;
export function bootMock() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  Promise.resolve(useChain.persist.rehydrate()).then(() => {
    useBoot.setState({ hydrated: true });
    setTimeout(() => useBoot.setState({ ready: true }), 550);
  });
}
/** True once persisted state is loaded (safe to read `me`) */
export const useHydrated = () => useBoot((s) => s.hydrated);
/** True once the simulated first fetch completes (show skeletons before) */
export const useReady = () => useBoot((s) => s.ready);

export function useMe() {
  const me = useChain((s) => s.me);
  useChain((s) => s.profiles); // re-render on profile edits
  return me ? getPerson(me) : null;
}

export function useMyAgreements(): MockAgreement[] {
  const me = useChain((s) => s.me);
  useChain((s) => s.profiles);
  const all = useChain((s) => s.agreements);
  return useMemo(() => (me ? all.filter((a) => involves(a, me)) : []), [all, me]);
}

export function useAgreement(id: string) {
  useChain((s) => s.profiles);
  return useChain((s) => s.agreements.find((a) => a.id === id));
}

export interface ActivityRow extends ReturnType<typeof describe> {
  e: MockEvent;
  a: MockAgreement;
}

export function useActivity(agreementId?: string): ActivityRow[] {
  const me = useChain((s) => s.me);
  const events = useChain((s) => s.events);
  const agreements = useChain((s) => s.agreements);
  const profiles = useChain((s) => s.profiles);
  return useMemo(() => {
    if (!me) return [];
    const byId = new Map(agreements.map((a) => [a.id, a]));
    return events
      .filter((e) => (agreementId ? e.agreementId === agreementId : true))
      .map((e) => ({ e, a: byId.get(e.agreementId)! }))
      .filter(({ a }) => a && involves(a, me))
      .sort((x, y) => y.e.at.localeCompare(x.e.at))
      .map(({ e, a }) => ({ e, a, ...describe(e, a, me as PersonKey) }));
  }, [events, agreements, me, agreementId, profiles]);
}

/** Re-render periodically so "3m ago" stays fresh */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
