"use client";

import { create } from "zustand";
import type { ActionKind } from "@milevault/api";

export type ToastTone = "success" | "money" | "info" | "warning" | "error";
export interface Toast { id: number; msg: string; tone: ToastTone; action?: { label: string; href: string }; hash?: string; duration: number }

/** Simulated wallet popup request (demo mode) */
export interface WalletPromptReq { kind: "connect" | "sign"; wallet?: string; purpose?: "signin" | "action"; title?: string; rows?: [string, string][]; fn?: string; address?: string }

export type Modal =
  | { t: "connect"; sw?: boolean }
  | { t: "connecting"; wallet: string; step: "address" | "signin"; requested?: boolean }
  | { t: "connDeclined"; wallet: string }
  | { t: "wrongNetwork"; wallet: string; walletNetwork: string; required: string }
  | { t: "connected"; wallet: string }
  | { t: "disconnect" }
  | { t: "install" }
  | { t: "action"; ref: string; kind: ActionKind; position?: number }
  | { t: "confirm"; op: ConfirmOp; ref: string; position?: number };

/** Off-chain (API-only) operations that just need a confirm/input dialog */
export type ConfirmOp = "publish" | "accept" | "cancel" | "submit" | "request_changes" | "withdraw_cancel" | "reject_cancel" | "delete_draft";

interface UI {
  modal: Modal | null;
  toasts: Toast[];
  redirect: string | null;
  afterConnect: string | null;
  /** Demo: simulated wallet popup */
  prompt: (WalletPromptReq & { resolve: () => void; reject: (e: Error) => void }) | null;
  demoWrongNetwork: boolean;
  open: (m: Modal) => void;
  close: () => void;
  toast: (msg: string, o?: { tone?: ToastTone; action?: Toast["action"]; hash?: string; duration?: number }) => void;
  dismiss: (id: number) => void;
  go: (href: string | null) => void;
  setAfterConnect: (h: string | null) => void;
  walletPrompt: (r: WalletPromptReq) => Promise<void>;
  set: (p: Partial<Pick<UI, "demoWrongNetwork">>) => void;
}

let n = 0;
export const useUI = create<UI>()((set, get) => ({
  modal: null, toasts: [], redirect: null, afterConnect: null, prompt: null, demoWrongNetwork: false,
  open: (m) => set({ modal: m }),
  close: () => { get().prompt?.reject(new Error("Declined in the wallet")); set({ modal: null, prompt: null }); },
  toast: (msg, o) => {
    const id = ++n; const tone = o?.tone ?? "success";
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, msg, tone, action: o?.action, hash: o?.hash, duration: o?.duration ?? (tone === "error" ? 7000 : 4500) }] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  go: (h) => set({ redirect: h }),
  setAfterConnect: (h) => set({ afterConnect: h }),
  walletPrompt: (r) => new Promise<void>((resolve, reject) => set({ prompt: { ...r, resolve: () => { set({ prompt: null }); resolve(); }, reject: (e) => { set({ prompt: null }); reject(e); } } })),
  set: (p) => set(p),
}));
