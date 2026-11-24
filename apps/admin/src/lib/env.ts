/** Public runtime config for the operator console. */
export const env = {
  /** "mock" = in-browser mock backend (demo); "live" = external MileVault backend */
  /** "live" whenever an API URL is configured, unless NEXT_PUBLIC_DATA_SOURCE says otherwise */
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE || (process.env.NEXT_PUBLIC_API_URL ? "live" : "mock")) as "mock" | "live",
  /** External MileVault backend base URL (not part of this repo) */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet",
  /** Reown (WalletConnect) project ID. When set, "WalletConnect" is offered for mobile wallets via QR. */
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
} as const;
