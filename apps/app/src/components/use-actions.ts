"use client";

import { useCallback } from "react";
import { env } from "@/lib/env";
import { explorer as explorerUrls, USDC_FAUCET_URL } from "@/lib/stellar/explorer";
import { shortHash, useUI } from "@/mock";

/** Small cross-cutting UI actions (copy, explorer, external links) with design toasts. */
export function useActions() {
  const toast = useUI((s) => s.toast);
  const isMock = env.dataSource === "mock";

  const copy = useCallback(
    async (text: string, msg = "Copied to clipboard") => {
      try { await navigator.clipboard.writeText(text); toast(msg); }
      catch { toast("Couldn’t copy. Select and copy it manually.", { tone: "error" }); }
    },
    [toast],
  );

  const explorer = useCallback(
    (hash: string, kind: "tx" | "contract" | "account" = "tx") => {
      if (isMock) return toast(`Demo: opens ${shortHash(hash)} on stellar.expert (Testnet)`, { tone: "info" });
      window.open(explorerUrls[kind](hash), "_blank", "noopener");
    },
    [isMock, toast],
  );

  const openExternal = useCallback((url: string) => {
    window.open(/^https?:\/\//.test(url) ? url : `https://${url}`, "_blank", "noopener");
  }, []);

  const faucet = useCallback(() => window.open(USDC_FAUCET_URL, "_blank", "noopener"), []);

  // Short link on the landing domain when configured; otherwise a path that works on either domain
  const agreementLink = (id: string) =>
    env.siteUrl ? `${env.siteUrl}/a/MV-${id}` : `${window.location.origin}/app/a/MV-${id}`;

  return { copy, explorer, openExternal, faucet, agreementLink };
}
