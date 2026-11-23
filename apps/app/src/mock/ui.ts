"use client";

import { create } from "zustand";
import { newHash } from "./format";
import { actAs, ContractError, useChain } from "./store";
import type { PersonKey, WalletId } from "./types";

export type TxKind =
  | "create" | "fund" | "approve" | "release" | "submit" | "accept" | "decline" | "cancel"
  | "request_cancel" | "confirm_cancel" | "withdraw_cancel";

export type TxStep = "review" | "wait" | "pending" | "done" | "declined" | "failed";

export interface TxModal {
  t: "tx";
  kind: TxKind;
  id?: string;
  i?: number;
  step: TxStep;
  hash?: string;
  link?: string;
  note?: string;
  error?: string;
  linkError?: string;
}

export type Modal =
  | TxModal
  | { t: "connect"; sw?: boolean }
  | { t: "connecting"; w: WalletId }
  | { t: "connected"; w: WalletId }
  | { t: "connDeclined"; w: WalletId }
  | { t: "wrongNetwork"; w: WalletId }
  | { t: "disconnect" }
  | { t: "install" }
  | { t: "received"; id: string; i: number };

export type ToastTone = "success" | "money" | "info" | "warning" | "error";
export interface Toast {
  id: number;
  msg: string;
  tone: ToastTone;
  action?: { label: string; href: string };
  /** Transaction hash → "View tx" chip */
  hash?: string;
  /** ms before auto-dismiss */
  duration: number;
}

interface UI {
  modal: Modal | null;
  /** Simulated wallet-extension popup visible */
  ext: boolean;
  toasts: Toast[];
  redirect: string | null;
  /** Where to go after connecting (deep links) */
  afterConnect: string | null;
  open: (m: Modal) => void;
  close: () => void;
  toast: (msg: string, opts?: { tone?: ToastTone; action?: Toast["action"]; hash?: string; duration?: number }) => void;
  dismiss: (id: number) => void;
  go: (href: string | null) => void;
  setAfterConnect: (href: string | null) => void;
  // wallet connection
  pickWallet: (w: WalletId) => void;
  walletDecline: () => void;
  // transactions
  startTx: (kind: TxKind, p?: { id?: string; i?: number }) => void;
  patchTx: (p: Partial<TxModal>) => void;
  sign: () => void;
  walletApprove: () => void;
  walletReject: () => void;
}

/** Kinds that open straight into the wallet prompt (no review step) — prototype: accept */
const NO_REVIEW: TxKind[] = ["accept", "withdraw_cancel"];

const ERRORS: Record<string, string> = {
  InsufficientBalance: "Your wallet doesn’t have enough test USDC for this. Nothing moved.",
  InsufficientEscrow: "The escrow doesn’t hold enough to pay this milestone. Nothing moved.",
  Unauthorized: "This wallet isn’t allowed to do that on this agreement. Nothing changed.",
  InvalidStatus: "The agreement changed before this confirmed. Refresh and try again.",
  InvalidMilestoneStatus: "That milestone isn’t in the right state anymore. Nothing changed.",
  OutOfSequence: "Milestones are submitted in order. Finish the current one first.",
  AlreadyPaid: "This milestone is already paid. It can’t be paid twice.",
  SameParty: "Client and contributor must be different wallets.",
  Network: "Stellar Testnet didn’t confirm the transaction, so nothing changed. It’s safe to try again.",
};

let toastN = 0;
let connectTimer: ReturnType<typeof setTimeout> | undefined;

export const useUI = create<UI>()((set, get) => ({
  modal: null,
  ext: false,
  toasts: [],
  redirect: null,
  afterConnect: null,

  open: (m) => set({ modal: m, ext: false }),
  close: () => {
    const m = get().modal;
    if (m?.t === "tx" && m.step === "pending") return; // can't dismiss mid-flight
    clearTimeout(connectTimer);
    set({ modal: null, ext: false });
  },
  toast: (msg, opts) => {
    const id = ++toastN;
    const tone = opts?.tone ?? "success";
    const duration = opts?.duration ?? (tone === "error" ? 7000 : 4500);
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, msg, tone, action: opts?.action, hash: opts?.hash, duration }] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  go: (href) => set({ redirect: href }),
  setAfterConnect: (href) => set({ afterConnect: href }),

  pickWallet: (w) => {
    set({ modal: { t: "connecting", w } });
    clearTimeout(connectTimer);
    connectTimer = setTimeout(() => {
      const m = get().modal;
      if (m?.t !== "connecting") return;
      if (useChain.getState().demo.wrongNetwork) return set({ modal: { t: "wrongNetwork", w } });
      useChain.getState().connect(w);
      set({ modal: { t: "connected", w } });
    }, 1500);
  },
  walletDecline: () => {
    const m = get().modal;
    if (m?.t === "connecting") { clearTimeout(connectTimer); set({ modal: { t: "connDeclined", w: m.w } }); }
  },

  startTx: (kind, p = {}) => {
    const step: TxStep = NO_REVIEW.includes(kind) ? "wait" : "review";
    set({ modal: { t: "tx", kind, step, ...p, link: "", note: "" }, ext: step === "wait" });
  },
  patchTx: (p) => { const m = get().modal; if (m?.t === "tx") set({ modal: { ...m, ...p } }); },
  sign: () => { const m = get().modal; if (m?.t === "tx") set({ modal: { ...m, step: "wait", error: undefined }, ext: true }); },
  walletReject: () => { const m = get().modal; if (m?.t === "tx") set({ modal: { ...m, step: "declined" }, ext: false }); },
  walletApprove: () => {
    const m = get().modal;
    if (m?.t !== "tx") return;
    const hash = newHash();
    const pending: TxModal = { ...m, step: "pending", hash };
    set({ modal: pending, ext: false });
    const chain = useChain.getState();
    setTimeout(() => {
      if (get().modal !== pending) return;
      try {
        if (useChain.getState().demo.failNext) {
          useChain.getState().setDemo({ failNext: false });
          throw new ContractError("Network");
        }
        finishTx(pending, hash);
      } catch (e) {
        const code = e instanceof Error ? e.message : "Network";
        set({ modal: { ...pending, step: "failed", error: ERRORS[code] ?? ERRORS.Network } });
      }
    }, chain.demo.latencyMs);
  },
}));

/** Apply the confirmed transaction to the mock chain and move the UI on. */
function finishTx(m: TxModal, hash: string) {
  const c = useChain.getState();
  const ui = useUI.getState();
  const me = c.me as PersonKey;
  const id = m.id!, i = m.i!;
  const a = () => useChain.getState().agreements.find((x) => x.id === id)!;
  const done = () => useUI.setState({ modal: { ...m, step: "done", hash } });
  const closeWith = (msg: string) => { useUI.setState({ modal: null }); if (c.prefs.txToasts) ui.toast(msg, { tone: "success", hash }); };
  switch (m.kind) {
    case "create": {
      const newId = c.createAgreement(hash);
      useUI.setState({ modal: null });
      ui.go(`/agreements/${newId}/created`);
      return;
    }
    case "fund": c.fund(id, hash); return done();
    case "release": c.release(id, i, hash); return done();
    case "approve": c.approve(id, i, hash); return closeWith(`${a().ms[i]!.title} approved. Release the payment when you’re ready.`);
    case "submit": c.submit(id, i, m.link ?? "", m.note ?? "", hash); return closeWith(`${a().ms[i]!.title} submitted. The client can review it now.`);
    case "accept": c.accept(id, hash); return closeWith("Accepted. The client can see you’ve started.");
    case "decline": c.decline(id, hash); return closeWith(`You declined ${a().name}`);
    case "cancel": c.cancel(id, hash); return closeWith(`${a().name} was cancelled`);
    case "request_cancel": c.requestCancel(id, me, hash); return closeWith("Cancellation requested. Nothing is refunded until the other side confirms.");
    case "confirm_cancel": c.confirmCancel(id, me, hash); return done();
    case "withdraw_cancel": c.withdrawCancel(id, me, hash); return closeWith("Cancellation withdrawn. The agreement continues.");
  }
}

export { actAs };
