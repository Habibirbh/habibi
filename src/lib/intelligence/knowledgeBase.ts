/**
 * Structured UAE Real Estate Knowledge Base & Platform Terms for Habibi Intelligence.
 */

export interface MarketBenchmark {
  emirate: string;
  community: string;
  propertyType: string;
  avgPricePerSqftAed: number;
  expectedGrossYieldPercent: number;
  occupancyRatePercent: number;
  recentTransactionsVolume: string;
  infrastructureHighlights: string[];
  lastUpdated: string;
}

export const uaeMarketBenchmarks: MarketBenchmark[] = [
  {
    emirate: "Dubai",
    community: "The Oasis",
    propertyType: "Luxury Villa",
    avgPricePerSqftAed: 1680,
    expectedGrossYieldPercent: 6.2,
    occupancyRatePercent: 94,
    recentTransactionsVolume: "AED 1.2B (Q1 2026)",
    infrastructureHighlights: ["Lagoon Masterplan", "Direct E311 Connectivity", "International Schools", "Private Beach Club"],
    lastUpdated: "2026-06-15",
  },
  {
    emirate: "Dubai",
    community: "DAMAC Hills 2",
    propertyType: "Apartment",
    avgPricePerSqftAed: 1215,
    expectedGrossYieldPercent: 7.8,
    occupancyRatePercent: 91,
    recentTransactionsVolume: "AED 850M (Q1 2026)",
    infrastructureHighlights: ["Water Town", "Sports Town", "Community Mall", "Landscaped Parks"],
    lastUpdated: "2026-06-15",
  },
  {
    emirate: "Dubai",
    community: "Dubai Marina",
    propertyType: "Waterfront Apartment",
    avgPricePerSqftAed: 2100,
    expectedGrossYieldPercent: 6.5,
    occupancyRatePercent: 95,
    recentTransactionsVolume: "AED 3.4B (Q1 2026)",
    infrastructureHighlights: ["Metro & Tram Access", "Marina Walk", "Beach Access", "Retail Promenade"],
    lastUpdated: "2026-06-15",
  },
];

export const habibiPlatformGlossary: Record<string, string> = {
  "Proposed Acquisition": "A property identified as a potential acquisition target by Habibi. Funds raised in the campaign are stored securely in smart contract escrow. The property is not yet acquired until funding and closing conditions are met.",
  "Escrow Vault": "The smart contract escrow address (HabibiCampaigns) on Robinhood Chain that holds conditional contribution funds until acquisition authorization or cancellation.",
  "Pull-Based Refund": "A safety feature of the Habibi smart contract allowing users to directly withdraw 100% of their contributed ETH if a campaign is cancelled or fails to reach its minimum threshold by the deadline.",
  "Robinhood Chain": "The Ethereum Layer-2 blockchain (Chain ID 4663) where Habibi smart contracts operate for fast, low-cost escrow commitments.",
  "Participation Units": "Contract-recorded fractional interests representing a participant's conditional entitlement in the property escrow campaign.",
  "SPV (Special Purpose Vehicle)": "A legal entity formed in a UAE free zone (such as DIFC or ADGM) designed to hold the physical title of an acquired property on behalf of tokenized interest holders.",
  "Minimum Threshold": "The minimum amount of funding required for a campaign to proceed toward acquisition authorization. If not met by closing time, refunds open automatically.",
};

export const defaultSystemPrompt = `You are Habibi Intelligence, an elite AI product architect, UAE real estate research analyst, property copilot, and document explainer embedded inside the Habibi platform on Robinhood Chain (Chain ID 4663).

Your core mandate:
1. Explain UAE real estate, Habibi proposed acquisition campaigns, property metadata, risk disclosures, escrow mechanics, and portfolio positions clearly and professionally.
2. Maintain a warm, highly professional, analytical, and trustworthy tone matching the Habibi editorial aesthetic.
3. Always separate facts from analysis and explicitly state missing data or uncertainty.
4. Never promise or guarantee financial returns or legal ownership titles.
5. Emphasize that contributions are conditional commitments held in smart contract escrow. If a campaign fails or is cancelled, contributors have a 100% pull-based refund right on-chain.
6. Cite verified sources whenever providing property facts.`;
