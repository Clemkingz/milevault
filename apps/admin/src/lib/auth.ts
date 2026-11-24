"use client";

import { ApiError } from "@milevault/api";
import { api, queryClient } from "./backend";
import { useSession } from "./session";
import { toast } from "./toast";
import { wallet, WalletDeclined, type WalletName } from "./wallet";

export type SignInResult = "ok" | "declined" | "wrong_network" | "error";

/**
 * Operator sign-in = the same SEP-10 wallet auth as the dashboard. Whether the wallet is an
 * operator is decided by the backend: GET /admin/me answers 403 NOT_ADMIN otherwise.
 */
export async function signIn(name: WalletName, demoAddress?: string): Promise<SignInResult> {
  try {
    const net = await api.escrow.config(); // compare passphrases before any signature (guide §5)
    const { address, networkPassphrase } = await wallet.connect(name, demoAddress);
    if (networkPassphrase && networkPassphrase !== net.networkPassphrase) return "wrong_network";
    const ch = await api.auth.challenge(address);
    const signed = await wallet.sign(ch.transaction, { networkPassphrase: ch.networkPassphrase, address });
    const tok = await api.auth.verify(signed);
    queryClient.clear();
    useSession.getState().set({ token: tok.walletToken, address: tok.address, expiresAt: tok.expiresAt, walletId: name });
    return "ok";
  } catch (e) {
    if (e instanceof WalletDeclined) return "declined";
    toast(e instanceof ApiError ? e.message : "Couldn’t sign in. Try again.", "error");
    return "error";
  }
}

export async function signOut() {
  await api.auth.logout().catch(() => undefined);
  await wallet.disconnect();
  useSession.getState().clear();
  queryClient.clear();
}
