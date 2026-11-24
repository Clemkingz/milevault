/** Public runtime config for the operator console. */
export const env = {
  /** "mock" = in-browser mock backend (demo); "live" = external MileVault backend */
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock") as "mock" | "live",
  /** External MileVault backend base URL (not part of this repo) */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet",
} as const;
