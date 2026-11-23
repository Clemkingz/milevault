/** Public runtime config. NEXT_PUBLIC_* values are inlined at build time. */
export const env = {
  /** "mock" = in-browser demo chain (src/mock); "live" = Soroban contract + API */
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock") as "mock" | "live",
  /** Public landing domain (the app is served under it at /app). Falls back to Vercel's URL. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string | undefined,
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet",
  networkPassphrase:
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015",
  sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org",
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
  escrowContractId: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ?? "",
  usdcTokenContractId: process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID ?? "",
  /** External MileVault backend (separate service, not in this repo). Required when dataSource is "live". */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  /** Same-origin by default: the landing proxies /app, so "/" is the landing */
  landingUrl: process.env.NEXT_PUBLIC_LANDING_URL ?? "/",
} as const;
