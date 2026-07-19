/**
 * Campaign registry + config for the conditional pre-acquisition model.
 *
 * ONCHAIN (source of truth, HabibiCampaigns): state, targets, committed,
 * escrow, participant count, unit conversion, timings.
 * OFFCHAIN (this file / metadataURI): display copy, representative imagery,
 * proposed acquisition economics, SPV/refund/acquisition conditions.
 *
 * IMPORTANT: Habibi does NOT own these properties. A contribution is a
 * conditional subscription toward a *proposed* acquisition — never completed
 * ownership. Imagery here is representative and clearly labelled; no
 * third-party listing photos, descriptions, or reference numbers are used.
 */

import {
  habibiCampaignsAbi,
  habibiCampaignsDeployments,
} from "@/lib/contracts/habibiCampaigns";
import { targetChain, APP_ENV } from "./chains";
import type { MediaKey } from "@/lib/media";

export const campaignsAbi = habibiCampaignsAbi;

/** Onchain campaign lifecycle (mirror of the Solidity enum). */
export enum CampaignState {
  None,
  Draft,
  DueDiligence,
  Scheduled,
  FundingOpen,
  FundingSuccessful,
  AcquisitionPending,
  Acquired,
  InterestsIssued,
  Cancelled,
  Refunding,
  Refunded,
}

export const campaignStateLabel: Record<CampaignState, string> = {
  [CampaignState.None]: "Unknown",
  [CampaignState.Draft]: "Draft",
  [CampaignState.DueDiligence]: "Due diligence",
  [CampaignState.Scheduled]: "Scheduled",
  [CampaignState.FundingOpen]: "Funding open",
  [CampaignState.FundingSuccessful]: "Funding complete — acquisition pending",
  [CampaignState.AcquisitionPending]: "Acquisition pending",
  [CampaignState.Acquired]: "Acquired",
  [CampaignState.InterestsIssued]: "Interests issued",
  [CampaignState.Cancelled]: "Cancelled",
  [CampaignState.Refunding]: "Refunding",
  [CampaignState.Refunded]: "Refunded",
};

export interface CampaignMeta {
  campaignId: bigint;
  slug: string;
  /** Public campaign name (not copied from any listing). */
  name: string;
  emirate: "Dubai" | "Abu Dhabi" | "Sharjah";
  location: string;
  /** Representative imagery key — final property materials pending. */
  image: MediaKey;
  representativeImagery: boolean;
  mediaRightsStatus: string;
  /** Original neutral description authored for Habibi — not a portal listing. */
  summary: string;
  /** Indicative reference price (e.g. listing asking price) — NOT secured. */
  indicativePrice: string;
  proposedAcquisitionPrice: string;
  acquisitionCostsBudget: string;
  contingency: string;
  proposedSPV: string;
  acquisitionStructure: string;
  /** Objective property attributes (facts — not copied listing copy). */
  facts: { label: string; value: string }[];
  amenities: string[];
  refundConditions: string[];
  acquisitionConditions: string[];
  riskFactors: string[];
  documents: { label: string; status: string }[];
}

/**
 * Registered campaigns. The single seeded campaign is a *proposed acquisition*
 * concept for a villa in The Oasis, Dubai. Per instructions: representative
 * imagery only, an original neutral description, no developer authorization
 * implied, and no third-party listing photos / reference numbers.
 */
export const campaignRegistry: CampaignMeta[] = [
  {
    campaignId: 1n,
    slug: "palmiera-2-oasis",
    name: "Palmiera 2 — The Oasis (Proposed Acquisition)",
    emirate: "Dubai",
    location: "The Oasis, Dubai",
    image: "palm",
    representativeImagery: true,
    mediaRightsStatus: "Representative imagery — final property materials pending",
    summary:
      "A proposed acquisition of a four-bedroom, lagoon-facing villa in the Palmiera 2 district of The Oasis masterplan, Dubai — a freehold, off-plan residence with an 8,267 sqft plot and 5,627 sqft built-up area, targeted for Q2 2028 handover. Habibi has identified this property as an acquisition target and is raising conditional commitments toward a potential purchase. The property has not been acquired and remains subject to due diligence, seller availability, pricing, and closing.",
    indicativePrice: "AED 9,470,000 (indicative reference — not secured)",
    proposedAcquisitionPrice: "Final price set at acquisition authorization",
    acquisitionCostsBudget: "To be disclosed in campaign terms",
    contingency: "To be disclosed in campaign terms",
    proposedSPV: "To be confirmed before acquisition close",
    acquisitionStructure: "Property-holding SPV with contract-recorded fractional interests",
    facts: [
      { label: "Type", value: "Villa · off-plan" },
      { label: "Bedrooms", value: "4" },
      { label: "Bathrooms", value: "6" },
      { label: "Plot area", value: "8,267 sqft" },
      { label: "Built-up area", value: "5,627 sqft" },
      { label: "Ownership", value: "Freehold" },
      { label: "Usage", value: "Residential" },
      { label: "Handover", value: "Q2 2028" },
      { label: "Masterplan completion", value: "~63% (as reported)" },
      { label: "Masterplan developer", value: "Emaar Properties (P.J.S.C)" },
    ],
    amenities: [
      "Balcony / terrace",
      "Private swimming pool",
      "Covered parking",
      "Centrally air-conditioned",
      "Electricity backup",
      "Lagoon-facing position",
    ],
    refundConditions: [
      "Full refund if the campaign does not reach its minimum threshold by the deadline.",
      "Full refund if the campaign is cancelled (e.g. seller withdraws or due diligence fails).",
      "Proportional refund of any excess if the final acquisition price is below funds raised.",
    ],
    acquisitionConditions: [
      "Funding reaches the required threshold.",
      "Due diligence, title, and valuation are satisfactory.",
      "Seller availability and price remain within approved limits.",
      "Signed acquisition authorization and approved payment destination.",
    ],
    riskFactors: [
      "Property values, rental income, liquidity, and exit timing are not guaranteed.",
      "The acquisition may not close; contributions are conditional and may be refunded.",
      "Participation units are contract-recorded interests, not standalone UAE land title.",
      "Availability depends on jurisdiction, eligibility, structure, and applicable law.",
    ],
    documents: [
      { label: "Participation terms", status: "Pending" },
      { label: "Risk disclosure", status: "Pending" },
      { label: "Independent valuation", status: "Pending" },
      { label: "Title / SPV documentation", status: "Pending" },
    ],
  },
];

export function campaignBySlug(slug: string): CampaignMeta | undefined {
  return campaignRegistry.find((c) => c.slug === slug);
}

export function campaignById(id: bigint): CampaignMeta | undefined {
  return campaignRegistry.find((c) => c.campaignId === id);
}

/**
 * Contract address: production from a verified deployment env var; development
 * from the local artifact. No fallback in production.
 */
export function campaignsContractAddress(): `0x${string}` | null {
  if (APP_ENV === "production") {
    const a = process.env.NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ADDRESS;
    return a && a.startsWith("0x") && a.length === 42 ? (a as `0x${string}`) : null;
  }
  return habibiCampaignsDeployments[targetChain.id]?.address ?? null;
}

/**
 * Whether onchain CONTRIBUTIONS may be submitted at all (spec §14). Fail-closed:
 * production requires the compliance API AND an explicit operator-authorization
 * flag confirming custodian/escrow + compliance are configured. Absent these,
 * the full property UX still renders in preview mode, but contributions are
 * disabled — never a silent fallback.
 */
export function contributionsEnabled(): { enabled: boolean; reason?: string } {
  if (!campaignsContractAddress()) {
    return { enabled: false, reason: "Campaign contract is not configured for this environment." };
  }
  if (APP_ENV === "production") {
    if (!process.env.NEXT_PUBLIC_COMPLIANCE_API_URL) {
      return { enabled: false, reason: "Eligibility verification is not yet configured for this deployment." };
    }
    if (process.env.NEXT_PUBLIC_OPERATOR_AUTHORIZATION_READY !== "true") {
      return {
        enabled: false,
        reason:
          "Fundraising is in preview: operator, custodian/escrow, and compliance authorization are not yet confirmed.",
      };
    }
  }
  return { enabled: true };
}
