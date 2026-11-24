"use client";

import { useSyncExternalStore } from "react";
import { Button, Icon } from "@milevault/ui";
import { imgUrl } from "../art";
import { usePrefs } from "@/lib/prefs";
import { useUI } from "@/lib/ui";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/* Capture the install prompt as early as possible (module scope, client only). */
let deferred: BIPEvent | null = null;
let installed = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIPEvent; emit(); });
  window.addEventListener("appinstalled", () => { installed = true; deferred = null; emit(); });
}

export type Platform = "ios" | "safari-mac" | "android" | "desktop";
function snapshot() {
  if (typeof window === "undefined") return "ssr";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return `${!!deferred}|${installed || standalone}`;
}

/** Install state: whether the native prompt is available, already installed, and the platform. */
export function usePwa() {
  const snap = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, snapshot, () => "ssr");
  const [canPrompt, isInstalled] = snap === "ssr" ? [false, false] : snap.split("|").map((x) => x === "true");
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const platform: Platform = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document)
    ? "ios" : /Android/.test(ua) ? "android" : /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua) ? "safari-mac" : "desktop";
  const install = async () => {
    if (deferred) {
      const d = deferred;
      await d.prompt();
      const { outcome } = await d.userChoice;
      deferred = null; emit();
      if (outcome === "accepted") useUI.getState().toast("MileVault is installing. Find it on your home screen or dock.");
      return;
    }
    useUI.getState().open({ t: "install" });
  };
  return { ssr: snap === "ssr", canPrompt, isInstalled, platform, install };
}

/** "Install MileVault" — sidebar promo (design promo card) or settings card. */
export function InstallCard({ variant = "side" }: { variant?: "side" | "card" }) {
  const { ssr, isInstalled, install } = usePwa();
  const dismissed = usePrefs((s) => s.installDismissed);
  const set = usePrefs((s) => s.set);
  if (ssr) return null;
  if (variant === "card")
    return (
      <div className="card side-card">
        <b>Get the app</b>
        <p style={{ color: "var(--sub)" }}>{isInstalled ? "MileVault is installed on this device. Open it from your home screen or dock." : "Install MileVault as an app. It opens in its own window, loads instantly and works offline."}</p>
        {!isInstalled && <Button variant="tint" h={36} icon="send" iconSize={16} onClick={install}>Install MileVault</Button>}
      </div>
    );
  if (isInstalled || dismissed) return null;
  return (
    <div className="promo" role="button" tabIndex={0} onClick={install} onKeyDown={(e) => e.key === "Enter" && install()}>
      <div className="media">
        <img src={imgUrl("promo")} alt="" />
        <button className="x" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); set({ installDismissed: true }); }}>
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="prow">
        <span className="tile"><Icon name="safe_lock" size={18} /></span>
        <div className="tx"><b>Install MileVault</b><small>Add it to your home screen or dock</small></div>
        <Icon name="arrow_up_right" size={14} />
      </div>
    </div>
  );
}
