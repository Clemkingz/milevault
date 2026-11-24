"use client";

import { ApiError } from "@milevault/api";
import { api, mock } from "./backend";
import { useDemo } from "./demo";
import { queryClient } from "./queries";
import { useSession } from "./session";
import { useUI } from "./ui";
import { wallet, WalletDeclined, type WalletName } from "./wallet";

/**
 * Connect + sign in (SEP-10): wallet shares its address → check its network matches the
 * platform → backend challenge → wallet signs (never submitted, moves no funds) → session token.
 */
export async function signIn(name: WalletName) {
  const ui = useUI.getState();
  ui.open({ t: "connecting", wallet: name, step: "address" });
  try {
    // Guide §5: compare the wallet's passphrase with GET /escrow/config before any signature
    const net = await queryClient.fetchQuery({ queryKey: ["escrow-config"], queryFn: api.escrow.config, staleTime: 10 * 60_000 });
    const { address, networkPassphrase } = await wallet.connect(name, mock ? useDemo.getState().address : undefined);
    if (networkPassphrase && networkPassphrase !== net.networkPassphrase) {
      ui.open({ t: "wrongNetwork", wallet: name, walletNetwork: networkPassphrase, required: net.network === "mainnet" ? "Stellar Mainnet" : "Stellar Testnet" });
      return;
    }
    ui.open({ t: "connecting", wallet: name, step: "signin" });
    const ch = await api.auth.challenge(address);
    const signed = await wallet.sign(ch.transaction, {
      networkPassphrase: ch.networkPassphrase, address, purpose: "signin", title: "Sign in to MileVault", fn: "web_auth",
      rows: [["Website", ch.homeDomain], ["Moves funds", "No"], ["Valid until", new Date(ch.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })]],
    });
    const tok = await api.auth.verify(signed);
    queryClient.clear();
    useSession.getState().set({ token: tok.walletToken, address: tok.address, shortAddress: tok.shortAddress, expiresAt: tok.expiresAt, walletId: name });
    ui.open({ t: "connected", wallet: name });
  } catch (e) {
    if (e instanceof WalletDeclined) return ui.open({ t: "connDeclined", wallet: name });
    ui.close();
    if (!(e instanceof ApiError)) console.error("[MileVault] wallet connection failed:", e);
    ui.toast(e instanceof ApiError ? e.message : `Couldn’t connect ${name}. ${e instanceof Error && e.message ? e.message : "Try again."}`, { tone: "error" });
  }
}

export async function signOut(opts: { silent?: boolean } = {}) {
  await api.auth.logout().catch(() => undefined);
  await wallet.disconnect();
  useSession.getState().clear();
  queryClient.clear();
  if (!opts.silent) useUI.getState().toast("Wallet disconnected. Nothing was signed.");
}
