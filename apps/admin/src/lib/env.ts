/** Public runtime config for the operator console. */
export const env = {
  /** "mock" = sample platform data in the browser; "live" = external MileVault backend */
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock") as "mock" | "live",
  /** External MileVault backend base URL (not part of this repo) */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet",
  sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org",
  escrowContractId: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ?? "",
} as const;
