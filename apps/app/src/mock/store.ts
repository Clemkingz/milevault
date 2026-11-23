"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { personByAddr, registerProfileSource, type Profile } from "./people";
import { seed } from "./seed";
import { curIdx, isFunded, locked, total } from "./selectors";
import type { Draft, MockAgreement, MockEvent, PersonKey, WalletId } from "./types";

/**
 * MOCK "chain + indexer" for the MVP UI.
 * Every mutation mirrors a Soroban escrow contract call and enforces
 * the same rules, so the UI can be exercised end-to-end before the backend exists.
 * Swap these for real contract calls + API reads when integrating.
 */

export const newDraft = (): Draft => ({ step: 1, name: "", desc: "", addr: "", ms: [{ title: "", desc: "", amount: "" }] });

type Balances = Record<PersonKey, { usdc: number; xlm: number }>;

interface DemoSettings {
  /** Next confirmed transaction fails on-chain (shows the failed state) */
  failNext: boolean;
  /** Simulated network confirmation time */
  latencyMs: number;
  /** Wallet reports Mainnet → wrong-network state */
  wrongNetwork: boolean;
}

interface State {
  me: PersonKey | null;
  wallet: WalletId | null;
  connectedAt: string | null;
  /** Which demo persona the mock wallet signs in as */
  persona: PersonKey;
  agreements: MockAgreement[];
  events: MockEvent[];
  balances: Balances;
  nextId: number;
  draft: Draft;
  promo: boolean;
  hideBal: boolean;
  demo: DemoSettings;
  /** Display name / photo per wallet (client and contributor alike) */
  profiles: Partial<Record<PersonKey, Profile>>;
  /** User preferences */
  prefs: { compact: boolean; txToasts: boolean; reduceMotion: boolean };
  /** PWA install card dismissed */
  installDismissed: boolean;
}

interface Actions {
  connect: (wallet: WalletId) => void;
  disconnect: () => void;
  setPersona: (p: PersonKey) => void;
  resetDemo: () => void;
  setDemo: (d: Partial<DemoSettings>) => void;
  setDraft: (d: Partial<Draft>) => void;
  resetDraft: () => void;
  set: (p: Partial<Pick<State, "promo" | "hideBal" | "installDismissed">>) => void;
  updateProfile: (key: PersonKey, p: Profile) => void;
  setPrefs: (p: Partial<State["prefs"]>) => void;
  // contract calls (called by the tx engine after "confirmation")
  createAgreement: (hash: string) => string;
  fund: (id: string, hash: string) => void;
  accept: (id: string, hash: string) => void;
  decline: (id: string, hash: string) => void;
  submit: (id: string, i: number, link: string, note: string, hash: string) => void;
  approve: (id: string, i: number, hash: string) => void;
  release: (id: string, i: number, hash: string) => void;
  cancel: (id: string, hash: string) => void;
  requestCancel: (id: string, by: PersonKey, hash: string) => void;
  confirmCancel: (id: string, by: PersonKey, hash: string) => void;
  withdrawCancel: (id: string, by: PersonKey, hash: string) => void;
}

const initial = (): State => ({
  me: null,
  wallet: null,
  connectedAt: null,
  persona: "aryan",
  ...seed(),
  draft: newDraft(),
  promo: true,
  hideBal: false,
  demo: { failNext: false, latencyMs: 1900, wrongNetwork: false },
  profiles: {},
  prefs: { compact: false, txToasts: true, reduceMotion: false },
  installDismissed: false,
});

class ContractError extends Error {}

/** Demo-only: perform contract calls as another party (the "other side" simulator). */
let actingAs: PersonKey | null = null;
export function actAs<T>(p: PersonKey, fn: () => T): T {
  actingAs = p;
  try { return fn(); } finally { actingAs = null; }
}
const now = () => new Date().toISOString();
let evN = 0;
const evId = () => `ev-${Date.now()}-${evN++}`;

export const useChain = create<State & Actions>()(
  persist(
    (set, get) => {
      /** Apply a mutation to one agreement + push an event */
      const mutate = (id: string, fn: (a: MockAgreement) => void, event?: Omit<MockEvent, "id" | "at" | "agreementId">) => {
        const a = get().agreements.find((x) => x.id === id);
        if (!a) throw new ContractError("AgreementNotFound");
        const copy: MockAgreement = structuredClone(a);
        fn(copy);
        set((s) => ({
          agreements: s.agreements.map((x) => (x.id === id ? copy : x)),
          events: event ? [{ id: evId(), at: now(), agreementId: id, ...event }, ...s.events] : s.events,
        }));
      };
      const move = (from: PersonKey | "escrow", to: PersonKey | "escrow", amount: number) =>
        set((s) => {
          const b = structuredClone(s.balances);
          if (from !== "escrow") {
            if (b[from].usdc < amount) throw new ContractError("InsufficientBalance");
            b[from].usdc = +(b[from].usdc - amount).toFixed(2);
          }
          if (to !== "escrow") b[to].usdc = +(b[to].usdc + amount).toFixed(2);
          return { balances: b };
        });
      const fee = (who: PersonKey) =>
        set((s) => ({ balances: { ...s.balances, [who]: { ...s.balances[who], xlm: +(s.balances[who].xlm - 0.00001).toFixed(5) } } }));
      const expect = (cond: boolean, err: string) => { if (!cond) throw new ContractError(err); };
      const who = () => actingAs ?? get().me;

      return {
        ...initial(),
        connect: (wallet) => set((s) => ({ me: s.persona, wallet, connectedAt: now() })),
        disconnect: () => set({ me: null, wallet: null, connectedAt: null }),
        setPersona: (p) => set((s) => ({ persona: p, me: s.me ? p : null, connectedAt: s.me ? now() : s.connectedAt })),
        resetDemo: () => set((s) => ({ ...initial(), me: s.me ? s.persona : null, persona: s.persona, wallet: s.wallet, connectedAt: s.connectedAt, profiles: s.profiles, prefs: s.prefs })),
        setDemo: (d) => set((s) => ({ demo: { ...s.demo, ...d } })),
        setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d, savedAt: now() } })),
        resetDraft: () => set({ draft: newDraft() }),
        set: (p) => set(p),
        updateProfile: (key, p) => set((s) => ({ profiles: { ...s.profiles, [key]: { ...s.profiles[key], ...p, updatedAt: now() } } })),
        setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),

        createAgreement: (hash) => {
          const { draft, nextId } = get();
          const me = who();
          expect(!!me, "Unauthorized");
          const contributor = personByAddr(draft.addr)?.key ?? "kay";
          expect(contributor !== me, "SameParty");
          const id = String(nextId);
          const a: MockAgreement = {
            id, name: draft.name.trim(), desc: draft.desc.trim(), client: me!, contributor, status: "created", color: "P", createdAt: now(), createHash: hash,
            ms: draft.ms.map((m) => ({ title: m.title.trim(), desc: m.desc.trim(), amount: parseFloat(m.amount), status: "pending" })),
          };
          expect(a.ms.every((m) => m.amount > 0), "InvalidAmount");
          set((s) => ({ agreements: [a, ...s.agreements], nextId: s.nextId + 1, draft: newDraft(),
            events: [{ id: evId(), at: now(), kind: "create", agreementId: id, actor: me!, hash }, ...s.events] }));
          fee(me!);
          return id;
        },
        fund: (id, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.client === who(), "Unauthorized");
          expect(a.status === "created", "InvalidStatus");
          move(a.client, "escrow", total(a));
          mutate(id, (x) => { x.status = "funded"; x.fundHash = hash; }, { kind: "fund", actor: a.client, amount: total(a), hash });
          fee(a.client);
        },
        accept: (id, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.contributor === who(), "Unauthorized");
          expect(a.status === "funded", "InvalidStatus");
          mutate(id, (x) => { x.status = "active"; }, { kind: "accept", actor: a.contributor, hash });
          fee(a.contributor);
        },
        decline: (id, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.contributor === who(), "Unauthorized");
          expect(a.status === "funded", "InvalidStatus");
          const refund = locked(a);
          move("escrow", a.client, refund);
          mutate(id, (x) => { x.status = "declined"; x.refunded = refund; }, { kind: "decline", actor: a.contributor, hash });
          fee(a.contributor);
        },
        submit: (id, i, link, note, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.contributor === who(), "Unauthorized");
          expect(a.status === "active", "InvalidStatus");
          expect(i === curIdx(a) && a.ms[i]?.status === "pending", "OutOfSequence");
          mutate(id, (x) => { Object.assign(x.ms[i]!, { status: "submitted", link: link.replace(/^https?:\/\//, ""), note, submittedAt: now() }); }, { kind: "submit", actor: a.contributor, i, hash });
          fee(a.contributor);
        },
        approve: (id, i, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.client === who(), "Unauthorized");
          expect(a.status === "active" && a.ms[i]?.status === "submitted", "InvalidMilestoneStatus");
          mutate(id, (x) => { Object.assign(x.ms[i]!, { status: "approved", approvedAt: now() }); }, { kind: "approve", actor: a.client, i, hash });
          fee(a.client);
        },
        release: (id, i, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          const m = a.ms[i]!;
          expect(a.client === who(), "Unauthorized");
          expect(m.status !== "paid", "AlreadyPaid");
          expect(a.status === "active" && m.status === "approved", "InvalidMilestoneStatus");
          expect(m.amount <= locked(a), "InsufficientEscrow");
          move("escrow", a.contributor, m.amount);
          mutate(id, (x) => {
            Object.assign(x.ms[i]!, { status: "paid", paidAt: now(), releaseHash: hash });
            if (x.ms.every((y) => y.status === "paid")) x.status = "completed";
          }, { kind: "release", actor: a.client, i, amount: m.amount, hash });
          fee(a.client);
        },
        cancel: (id, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.client === who(), "Unauthorized");
          expect(a.status === "created", "InvalidStatus");
          mutate(id, (x) => { x.status = "cancelled"; }, { kind: "cancel", actor: a.client, hash });
          fee(a.client);
        },
        requestCancel: (id, by, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.client === by || a.contributor === by, "Unauthorized");
          expect(a.status === "funded" || a.status === "active", "InvalidStatus");
          mutate(id, (x) => { x.cancelPrevStatus = x.status; x.status = "cancel_requested"; x.cancelRequestedBy = by; }, { kind: "cancel_request", actor: by, hash });
          fee(by);
        },
        confirmCancel: (id, by, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.status === "cancel_requested", "InvalidStatus");
          expect((a.client === by || a.contributor === by) && a.cancelRequestedBy !== by, "Unauthorized");
          const refund = locked(a);
          if (refund > 0) move("escrow", a.client, refund);
          mutate(id, (x) => { x.status = "cancelled"; x.refunded = refund; x.cancelRequestedBy = undefined; }, { kind: "cancel", actor: by, hash });
          if (refund > 0) set((s) => ({ events: [{ id: evId(), at: now(), kind: "refund", agreementId: id, actor: by, amount: refund, hash }, ...s.events] }));
          fee(by);
        },
        withdrawCancel: (id, by, hash) => {
          const a = get().agreements.find((x) => x.id === id)!;
          expect(a.status === "cancel_requested" && a.cancelRequestedBy === by, "Unauthorized");
          mutate(id, (x) => { x.status = x.cancelPrevStatus ?? "active"; x.cancelRequestedBy = undefined; x.cancelPrevStatus = undefined; }, { kind: "cancel_withdraw", actor: by, hash });
          fee(by);
        },
      };
    },
    {
      name: "milevault-demo",
      version: 2,
      // v1 → v2: profiles, prefs, installDismissed added (defaults fill in)
      migrate: (persisted) => persisted as State & Actions,
      merge: (persisted, current) => ({ ...current, ...(persisted as object), prefs: { ...current.prefs, ...((persisted as Partial<State>)?.prefs ?? {}) } }),
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export { ContractError, isFunded };

// Let getPerson() read saved profiles
registerProfileSource(() => useChain.getState().profiles);
