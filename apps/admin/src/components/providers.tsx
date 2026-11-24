"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Icon } from "@milevault/ui";
import { queryClient } from "@/lib/backend";
import { useToasts } from "@/lib/toast";

const TONE = { success: ["check_circle", "#00CE5C"], info: ["info", "#2EBEF2"], warning: ["alert", "#F0AF30"], error: ["close_circle", "#FE393B"] } as const;

function Toaster() {
  const { items, drop } = useToasts();
  return (
    <div className="adm-toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="adm-toast">
          <Icon name={TONE[t.tone][0]} size={18} color={TONE[t.tone][1]} />
          <span>{t.msg}</span>
          <button onClick={() => drop(t.id)} aria-label="Dismiss"><Icon name="close" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}<Toaster /></QueryClientProvider>;
}
