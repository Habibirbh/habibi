import { formatEther } from "viem";

/** Format wei → "1.5 ETH" (trim trailing zeros, cap decimals). */
export function eth(wei: bigint, maxDecimals = 4): string {
  const s = formatEther(wei);
  const [int, frac = ""] = s.split(".");
  const trimmed = frac.slice(0, maxDecimals).replace(/0+$/, "");
  return trimmed ? `${int}.${trimmed} ETH` : `${int} ETH`;
}

/**
 * Funded basis points via bigint arithmetic only (spec §16): never convert wei
 * to Number before dividing.
 */
export function fundedBps(totalContributedWei: bigint, fundingTargetWei: bigint): number {
  if (fundingTargetWei === 0n) return 0;
  return Number((totalContributedWei * 10_000n) / fundingTargetWei);
}

/** "39.4%" style display from bps. */
export function bpsToPercent(bps: number, decimals = 1): string {
  return `${(bps / 100).toFixed(decimals)}%`;
}

export function shortAddress(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
