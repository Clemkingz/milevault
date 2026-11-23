"use client";

import { useEffect, type ReactNode } from "react";
import { env } from "@/lib/env";
import { bootMock, useChain, useHydrated, useMe } from "@/mock";
import { ConnectGate } from "./gate";
import { DemoPanel } from "./demo-panel";
import { TabBar } from "./mobile";
import { Sidebar } from "./sidebar";
import { VaultLoader } from "@milevault/ui";

export function useBoot() {
  useEffect(() => { bootMock(); registerSW(); }, []);
  return useHydrated();
}

/** Service worker for the installable app (production builds; opt in locally with NEXT_PUBLIC_PWA_DEV=1) */
function registerSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_PWA_DEV !== "1") return;
  navigator.serviceWorker.register("/app/sw.js", { scope: "/app/" }).catch(() => undefined);
}

/** Reflect user preferences on <html> so every screen (and portals) honours them */
function usePrefsClasses() {
  const prefs = useChain((s) => s.prefs);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("compact", prefs.compact);
    el.classList.toggle("reduce-motion", prefs.reduceMotion);
  }, [prefs]);
}

/** Authenticated app frame: sidebar (desktop) / tab bar (mobile) around the page */
export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useBoot();
  const me = useMe();
  usePrefsClasses();
  if (!hydrated) return <VaultLoader fullscreen />;
  if (!me) return (<><ConnectGate />{env.dataSource === "mock" && <DemoPanel />}</>);
  return (
    <div className="app">
      <a href="#main" className="skip">Skip to content</a>
      <Sidebar />
      <div className="main">{children}</div>
      <TabBar />
      {env.dataSource === "mock" && <DemoPanel />}
    </div>
  );
}
