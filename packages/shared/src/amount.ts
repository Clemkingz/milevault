/** Stellar assets use 7 decimal places. */
export const TOKEN_DECIMALS = 7;
const SCALE = 10n ** BigInt(TOKEN_DECIMALS);

/** "300.5" -> 3005000000n */
export function toBaseUnits(amount: string): bigint {
  const [whole = "0", frac = ""] = amount.trim().split(".");
  if (frac.length > TOKEN_DECIMALS) {
    throw new Error(`Amount has more than ${TOKEN_DECIMALS} decimals`);
  }
  return BigInt(whole) * SCALE + BigInt(frac.padEnd(TOKEN_DECIMALS, "0"));
}

/** 3005000000n -> "300.5" */
export function fromBaseUnits(value: bigint | string): string {
  const v = BigInt(value);
  const negative = v < 0n;
  const abs = negative ? -v : v;
  const whole = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(TOKEN_DECIMALS, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** Display formatter, e.g. "1,500.00 USDC" */
export function formatAmount(value: bigint | string, symbol = "USDC"): string {
  const n = Number(fromBaseUnits(value));
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

export function sumAmounts(amounts: string[]): bigint {
  return amounts.reduce((acc, a) => acc + toBaseUnits(a || "0"), 0n);
}
