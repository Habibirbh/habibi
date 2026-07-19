/** Money + number formatting helpers (AED). */

export function aed(n: number, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? (Number.isInteger(n) ? 0 : 2);
  return `AED ${n.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Compact AED, e.g. AED 3.8M / AED 620K. */
export function aedCompact(n: number): string {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `AED ${Math.round(n / 1_000)}K`;
  return `AED ${n}`;
}

export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

/** Truncate a wallet address for display. */
export function shortAddress(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
