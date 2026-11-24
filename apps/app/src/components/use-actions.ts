"use client";

import { useCallback } from "react";
import { env } from "@/lib/env";
import { useNetwork } from "@/lib/queries";
import { useUI } from "@/lib/ui";

/** Copy / explorer / external links with design toasts. Explorer base comes from the backend. */
export function useActions() {
  const toast = useUI((s) => s.toast);
  const { data: net } = useNetwork();
  const explorerBase = net?.explorerUrl ?? "https://stellar.expert/explorer/testnet";

  const copy = useCallback(async (text: string, msg = "Copied to clipboard") => {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch { toast("Couldn’t copy. Select and copy it manually.", { tone: "error" }); }
  }, [toast]);

  const explorer = useCallback((value: string, kind: "tx" | "account" = "tx") => {
    if (env.dataSource === "mock") return toast("Demo data: this transaction isn’t on Stellar.", { tone: "info" });
    window.open(`${explorerBase}/${kind}/${value}`, "_blank", "noopener");
  }, [explorerBase, toast]);

  const openExternal = useCallback((url: string) => window.open(/^https?:\/\//.test(url) ? url : `https://${url}`, "_blank", "noopener"), []);
  const agreementLink = (ref: string) => (env.siteUrl ? `${env.siteUrl}/a/${ref}` : `${window.location.origin}/app/a/${ref}`);
  return { copy, explorer, openExternal, agreementLink, explorerBase };
}
