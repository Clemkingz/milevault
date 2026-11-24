"use client";

import { create } from "zustand";

export type Tone = "success" | "info" | "warning" | "error";
export interface Toast { id: number; msg: string; tone: Tone }
let seq = 0;

export const useToasts = create<{ items: Toast[]; push: (msg: string, tone?: Tone) => void; drop: (id: number) => void }>()((set, get) => ({
  items: [],
  push: (msg, tone = "success") => {
    const id = ++seq;
    set((s) => ({ items: [...s.items.slice(-2), { id, msg, tone }] }));
    setTimeout(() => get().drop(id), tone === "error" ? 6000 : 4000);
  },
  drop: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
export const toast = (msg: string, tone?: Tone) => useToasts.getState().push(msg, tone);
