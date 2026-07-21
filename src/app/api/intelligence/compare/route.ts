import { NextResponse } from "next/server";
import { calculateHabibiScore } from "@/lib/intelligence/scoringEngine";
import { campaignBySlug } from "@/lib/web3/campaigns";
import type { PropertyComparisonResult } from "@/lib/intelligence/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slugs: string[] = body.slugs || ["palmiera-2-oasis", "elo-damac"];

    const scores = slugs.map((slug) => calculateHabibiScore(slug));
    const campaigns = slugs.map((slug) => campaignBySlug(slug)).filter(Boolean);

    const categoryComparison = [
      {
        category: "Property Type",
        values: Object.fromEntries(campaigns.map((c) => [c!.slug, c!.facts[0]?.value || "N/A"])),
      },
      {
        category: "Indicative Valuation",
        values: Object.fromEntries(campaigns.map((c) => [c!.slug, c!.indicativePrice])),
      },
      {
        category: "Habibi Score",
        values: Object.fromEntries(scores.map((s) => [s.propertySlug, `${s.propertyScore} / 100`])),
      },
      {
        category: "Data Confidence",
        values: Object.fromEntries(scores.map((s) => [s.propertySlug, `${s.dataConfidenceScore} / 100`])),
      },
    ];

    const result: PropertyComparisonResult = {
      propertyIds: slugs,
      categoryComparison,
      majorDifferences: [
        "Palmiera 2 is a prime luxury 4-bedroom villa vs ELO 1-bedroom apartment.",
        "Indicative pricing ranges from AED 639k (ELO) to AED 9.47M (Palmiera 2).",
        "Both properties feature 100% smart contract escrow refund protection on Robinhood Chain.",
      ],
      strengthsByProperty: {
        "palmiera-2-oasis": ["Lagoon-facing position", "Emaar Masterplan", "High capital preservation"],
        "elo-damac": ["Accessible price point ($30 min)", "Strong gross yield potential", "Q4 2026 completion"],
      },
      risksByProperty: {
        "palmiera-2-oasis": ["Higher commitment threshold", "Longer handover timeline (Q2 2028)"],
        "elo-damac": ["Higher density community", "Smaller unit built-up area"],
      },
      suitabilityContexts: [
        {
          persona: "Capital Preservation & Prime Estate",
          recommendedSlug: "palmiera-2-oasis",
          reasoning: "Palmiera 2 offers prime luxury villa positioning in Emaar's signature expansion corridor.",
        },
        {
          persona: "Yield-Oriented & Entry-Level Participation",
          recommendedSlug: "elo-damac",
          reasoning: "ELO Damac offers an accessible price point with attractive prospective rental yield metrics.",
        },
      ],
      confidence: 88,
      citations: [
        {
          id: "cite-comp-meta",
          sourceType: "property_meta",
          title: "Habibi Verified Campaign Registry",
          url: "/intelligence/compare",
        },
      ],
      comparisonSummary:
        "Based on verified property specifications and scoring metrics, Palmiera 2 aligns with long-term capital preservation in luxury villas, whereas ELO Damac provides accessible fractional entry with strong prospective rental yield metrics.",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Comparison Error:", error);
    return NextResponse.json({ error: "Failed to generate comparison" }, { status: 500 });
  }
}
