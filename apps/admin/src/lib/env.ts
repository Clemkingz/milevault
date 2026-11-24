/** Public runtime config for the operator console. */
export const env = {
  /** "mock" = in-browser mock backend (demo); "live" = external MileVault backend */
  /** "live" whenever an API URL is configured, unless NEXT_PUBLIC_DATA_SOURCE says otherwise */
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE || (process.env.NEXT_PUBLIC_API_URL ? "live" : "mock")) as "mock" | "live",
  /** External MileVault backend base URL (not part of this repo) */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet",
  /**
   * Reown (WalletConnect) project ID: how phones reach the Varial app. It's a public identifier
   * (shipped to every browser; Reown restricts it to the allowed domains), so MileVault's own ID is
   * the default and deployments work without extra setup. Override with NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
   */
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "b8cc56756132b11f2077932ac3d6f807",
} as const;
