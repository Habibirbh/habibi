import { describe, it, expect } from "vitest";
import { criticalCampaignConfig, CampaignState } from "../campaigns";

const base = {
  fundingTargetWei: 40n * 10n ** 18n,
  minContributionWei: 5n * 10n ** 16n,
  weiPerUnit: 5n * 10n ** 16n,
  closingTime: 9_999_999_999n,
  state: CampaignState.FundingOpen,
};

describe("criticalCampaignConfig — contributions gated on valid onchain config", () => {
  it("valid when all critical values set and FundingOpen", () => {
    expect(criticalCampaignConfig(base).valid).toBe(true);
  });
  it("invalid when target/unit/min/deadline missing", () => {
    expect(criticalCampaignConfig({ ...base, fundingTargetWei: 0n }).valid).toBe(false);
    expect(criticalCampaignConfig({ ...base, weiPerUnit: 0n }).valid).toBe(false);
    expect(criticalCampaignConfig({ ...base, minContributionWei: 0n }).valid).toBe(false);
    expect(criticalCampaignConfig({ ...base, closingTime: 0n }).valid).toBe(false);
  });
  it("invalid unless state is FundingOpen (no contributions when successful/cancelled)", () => {
    expect(criticalCampaignConfig({ ...base, state: CampaignState.FundingSuccessful }).valid).toBe(false);
    expect(criticalCampaignConfig({ ...base, state: CampaignState.Cancelled }).valid).toBe(false);
    expect(criticalCampaignConfig({ ...base, state: CampaignState.Acquired }).valid).toBe(false);
  });
});
