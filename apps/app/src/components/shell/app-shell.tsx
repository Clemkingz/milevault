"use client";

import { useEffect, useState, type ReactNode } from "react";
import { VaultLoader } from "@milevault/ui";
import { env } from "@/lib/env";
import { usePrefs } from "@/lib/prefs";
import { useSessionCheck } from "@/lib/queries";
import { isExpired, useSession } from "@/lib/session";
import { ConnectGate } from "./gate";
import { DemoPanel } from "./demo-panel";
import { TabBar } from "./mobile";
import { Sidebar } from "./sidebar";

/** Client mount flag (persisted stores rehydrate from localStorage on the client) */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function registerSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_PWA_DEV !== "1") return;
  navigator.serviceWorker.register("/app/sw.js", { scope: "/app/" }).catch(() => undefined);
}

function usePrefsClasses() {
  const compact = usePrefs((s) => s.compact), reduce = usePrefs((s) => s.reduceMotion);
  useEffect(() => {
    document.documentElement.classList.toggle("compact", compact);
    document.documentElement.classList.toggle("reduce-motion", reduce);
  }, [compact, reduce]);
}

/** Authenticated frame. Restores the wallet session (GET /wallet-auth/session) or shows the gate. */
export function AppShell({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const token = useSession((s) => s.token);
  const expiresAt = useSession((s) => s.expiresAt);
  const check = useSessionCheck();
  usePrefsClasses();
  useEffect(() => { registerSW(); }, []);
  useEffect(() => { if (token && isExpired(expiresAt)) useSession.getState().expire(); }, [token, expiresAt]);

  if (!mounted || (token && check.isPending)) return <VaultLoader fullscreen label={token ? "Restoring your session" : undefined} />;
  if (!token) return <>{<ConnectGate />}{env.dataSource === "mock" && <DemoPanel />}</>;
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
