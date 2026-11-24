"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrefsState { hideBal: boolean; compact: boolean; reduceMotion: boolean; txToasts: boolean; installDismissed: boolean }
interface Prefs extends PrefsState { set: (p: Partial<PrefsState>) => void }

/** Device preferences (localStorage) */
export const usePrefs = create<Prefs>()(
  persist((set) => ({ hideBal: false, compact: false, reduceMotion: false, txToasts: true, installDismissed: false, set: (p) => set(p) }), { name: "milevault-prefs" }),
);
