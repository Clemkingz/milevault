/** Public runtime config. NEXT_PUBLIC_* values are inlined at build time. */
export const env = {
  /** "mock" = in-browser mock backend (demo); "live" = the external MileVault API */
  /** "live" whenever an API URL is configured, unless NEXT_PUBLIC_DATA_SOURCE says otherwise */
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE || (process.env.NEXT_PUBLIC_API_URL ? "live" : "mock")) as "mock" | "live",
  /** Public landing domain (the app is served under it at /app). Falls back to Vercel's URL. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string | undefined,
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet",
  /**
   * Reown (WalletConnect) project ID: how phones reach the Varial app. It's a public identifier
   * (shipped to every browser; Reown restricts it to the allowed domains), so MileVault's own ID is
   * the default and deployments work without extra setup. Override with NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
   */
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "b8cc56756132b11f2077932ac3d6f807",
  /** Fallback only: Horizon normally comes from GET /stellar/network */
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
  /** External MileVault backend (separate service, not in this repo). Required when dataSource is "live". */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  /** Same-origin by default: the landing proxies /app, so "/" is the landing */
  landingUrl: process.env.NEXT_PUBLIC_LANDING_URL ?? "/",
} as const;
