"use client";

import { contract } from "@stellar/stellar-sdk";
import { env } from "../env";
import { signTransaction } from "./wallet-kit";

/**
 * Escrow contract client.
 *
 * TODO(contract): once the contract is deployed, run `pnpm contract:bindings` to generate a
 * typed client into packages/escrow-client and replace `Client & EscrowMethods` below with it.
 * The method names here mirror contracts/escrow/src/lib.rs.
 */
export interface EscrowMethods {
  create_agreement: unknown;
  fund: unknown;
  accept: unknown;
  decline: unknown;
  submit_milestone: unknown;
  approve_milestone: unknown;
  release: unknown;
  cancel: unknown;
  request_cancel: unknown;
  confirm_cancel: unknown;
  get_agreement: unknown;
}

export async function getEscrowClient(publicKey: string) {
  if (!env.escrowContractId) {
    throw new Error("NEXT_PUBLIC_ESCROW_CONTRACT_ID is not set — deploy the contract first.");
  }
  return contract.Client.from({
    contractId: env.escrowContractId,
    rpcUrl: env.sorobanRpcUrl,
    networkPassphrase: env.networkPassphrase,
    publicKey,
    signTransaction: (xdr) => signTransaction(xdr, publicKey),
  }) as Promise<contract.Client & EscrowMethods>;
}
