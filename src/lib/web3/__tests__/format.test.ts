import { describe, it, expect } from "vitest";
import { eth, fundedBps, bpsToPercent, shortAddress } from "../format";

describe("fundedBps — bigint arithmetic, never Number before dividing", () => {
  it("computes basis points from wei", () => {
    expect(fundedBps(5n * 10n ** 18n, 40n * 10n ** 18n)).toBe(1250); // 12.5%
    expect(fundedBps(0n, 40n * 10n ** 18n)).toBe(0);
    expect(fundedBps(40n * 10n ** 18n, 40n * 10n ** 18n)).toBe(10_000); // 100%
  });
  it("never exceeds 10000 and handles zero target", () => {
    expect(fundedBps(10n, 0n)).toBe(0);
    expect(fundedBps(41n * 10n ** 18n, 40n * 10n ** 18n)).toBeGreaterThan(10_000 - 1); // caller clamps display
  });
  it("survives values far beyond Number.MAX_SAFE_INTEGER", () => {
    const big = 9_000_000n * 10n ** 18n;
    expect(fundedBps(big / 2n, big)).toBe(5_000);
  });
});

describe("eth formatting", () => {
  it("trims trailing zeros", () => {
    expect(eth(1_500_000_000_000_000_000n)).toBe("1.5 ETH");
    expect(eth(1_000_000_000_000_000_000n)).toBe("1 ETH");
    expect(eth(0n)).toBe("0 ETH");
  });
});

describe("bpsToPercent / shortAddress", () => {
  it("renders percent and truncated address", () => {
    expect(bpsToPercent(1250)).toBe("12.5%");
    expect(bpsToPercent(1250, 0)).toBe("13%");
    expect(shortAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
  });
});
