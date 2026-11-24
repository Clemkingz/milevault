"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockWallets } from "@milevault/api";

/** Demo-only: which mock wallet "your" simulated wallet holds */
export const useDemo = create<{ address: string; setAddress: (a: string) => void }>()(
  persist((set) => ({ address: mockWallets[0]!.address, setAddress: (address) => set({ address }) }), { name: "milevault-demo-wallet" }),
);
