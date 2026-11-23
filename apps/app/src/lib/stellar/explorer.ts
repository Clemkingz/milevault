import { env } from "../env";

const base = `https://stellar.expert/explorer/${env.network === "public" ? "public" : "testnet"}`;

export const explorer = {
  tx: (hash: string) => `${base}/tx/${hash}`,
  account: (address: string) => `${base}/account/${address}`,
  contract: (id: string) => `${base}/contract/${id}`,
};

export const FRIENDBOT_URL = "https://friendbot.stellar.org";
/** Circle's testnet USDC faucet */
export const USDC_FAUCET_URL = "https://faucet.circle.com";
