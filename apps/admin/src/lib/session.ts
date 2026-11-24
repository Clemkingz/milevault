"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Operator wallet session (SEP-10 token). Separate from the dashboard's session. */
interface AdminSession {
  token: string | null;
  address: string | null;
  expiresAt: string | null;
  walletId: string | null;
  expired: boolean;
  set: (s: { token: string; address: string; expiresAt: string; walletId: string }) => void;
  clear: () => void;
  expire: () => void;
}

export const useSession = create<AdminSession>()(
  persist(
    (set) => ({
      token: null, address: null, expiresAt: null, walletId: null, expired: false,
      set: (s) => set({ ...s, expired: false }),
      clear: () => set({ token: null, address: null, expiresAt: null, walletId: null, expired: false }),
      expire: () => set((s) => (s.token ? { token: null, expired: true } : s)),
    }),
    { name: "milevault-admin-session", storage: createJSONStorage(() => sessionStorage), partialize: (s) => ({ token: s.token, address: s.address, expiresAt: s.expiresAt, walletId: s.walletId }) },
  ),
);
