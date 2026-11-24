"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Wallet session from POST /wallet-auth/verify (SEP-10). Kept in sessionStorage, as the integration guide does. */
interface Session {
  token: string | null;
  address: string | null;
  shortAddress: string | null;
  expiresAt: string | null;
  walletId: string | null;
  /** true after a 401 or expiry — prompts to sign in again */
  expired: boolean;
  set: (s: { token: string; address: string; shortAddress: string; expiresAt: string; walletId: string }) => void;
  clear: () => void;
  expire: () => void;
}

export const useSession = create<Session>()(
  persist(
    (set) => ({
      token: null, address: null, shortAddress: null, expiresAt: null, walletId: null, expired: false,
      set: (s) => set({ ...s, expired: false }),
      clear: () => set({ token: null, address: null, shortAddress: null, expiresAt: null, walletId: null, expired: false }),
      expire: () => set((s) => (s.token ? { token: null, expired: true } : s)),
    }),
    { name: "milevault-session", storage: createJSONStorage(() => sessionStorage), partialize: (s) => ({ token: s.token, address: s.address, shortAddress: s.shortAddress, expiresAt: s.expiresAt, walletId: s.walletId }) },
  ),
);

export const isExpired = (iso: string | null) => !iso || new Date(iso).getTime() <= Date.now();
