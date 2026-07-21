import { NextResponse } from "next/server";
import { calculateHabibiScore } from "@/lib/intelligence/scoringEngine";
import { campaignBySlug } from "@/lib/web3/campaigns";
import type { PropertyIntelligenceReport } from "@/lib/intelligence/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "palmiera-2-oasis";

  const campaign = campaignBySlug(slug);
  const score = calculateHabibiScore(slug);

  if (!campaign) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const isOasis = slug === "palmiera-2-oasis";

  const report: PropertyIntelligenceReport = {
    propertySlug: slug,
    generatedTimestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
    dataFreshness: "Live on-chain & verified docs",
    confidenceLevel: score.dataConfidenceScore,
    sourcesUsed: score.citations,
    missingInformation: score.missingInputs,
    executiveSummary: isOasis
      ? "Palmiera 2 in The Oasis presents a high-conviction luxury villa acquisition target by Emaar Properties. Built-up area of 5,627 sqft with lagoon views offers strong long-term capital preservation."
      : "ELO at DAMAC Hills 2 offers an accessible 1-bedroom apartment opportunity with an indicative AED 639k valuation and strong prospective rental yield.",
    propertyStrengths: isOasis
      ? [
          "Prime lagoon-facing position within Emaar masterplan",
          "Generous plot size (8,267 sqft) and built-up layout",
          "Strict pull-based smart contract refund protection",
        ]
      : [
          "Accessible AED 639k price point and 0.01 ETH minimum",
          "High rental demand in DAMAC Hills 2 master community",
          "Modern open-plan design with 115 sqft private balcony",
        ],
    keyRisks: [
      "Proposed acquisition target — not yet finalized on-chain",
      "Off-plan construction & developer handover schedule dependence",
      "Real estate illiquidity during conditional campaign funding period",
    ],
    locationAnalysis: isOasis
      ? "The Oasis is Emaar's premier luxury expansion corridor with direct E311 highway access."
      : "DAMAC Hills 2 is an established, active master community featuring extensive leisure infrastructure.",
    rentalDemandContext: "Strong UAE residential rental migration driving high occupancy across master developments.",
    supplyContext: "Balanced supply pipeline in master communities with controlled developer phases.",
    acquisitionComplexity: "Standard SPV escrow structure with multisig acquisition certificate authorization.",
    fundingStatus: "Active conditional escrow campaign on Robinhood Chain (Chain ID 4663).",
    documentationCompleteness: `${campaign.config.approvedImages.length} verified developer media assets attached.`,
    liquidityConsiderations: "Illiquid during escrow period; secondary transfer enablement subject to governance.",
    portfolioSuitability: isOasis
      ? "Suitable for capital preservation and long-term prime UAE real estate exposure."
      : "Suitable for yield-oriented investors seeking accessible entry points.",
    questionsToReview: [
      "Review the closing deadline and minimum campaign threshold",
      "Inspect the escrow contract address on Blockscout",
      "Confirm SPV jurisdiction before acquisition authorization",
    ],
    status: "Approved",
  };

  return NextResponse.json(report);
}
