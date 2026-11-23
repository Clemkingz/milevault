"use client";

import { Modals, RedirectWatcher } from "./overlays";
import { Toaster } from "./toaster";

export function Overlays() {
  return (
    <>
      <Modals />
      <Toaster />
      <RedirectWatcher />
    </>
  );
}
