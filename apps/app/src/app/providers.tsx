"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Overlays } from "@/components/overlays/root";
import { queryClient } from "@/lib/queries";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Overlays />
    </QueryClientProvider>
  );
}
