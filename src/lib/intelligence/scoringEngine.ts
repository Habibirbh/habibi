import type { HabibiScoreResult, ScoreCategory, Citation } from "./types";
import { campaignBySlug } from "../web3/campaigns";

export interface CategoryWeightConfig {
  locationQuality: number; // default 15
  demandProfile: number; // default 12
  propertyCharacteristics: number; // default 10
  pricingContext: number; // default 12
  documentationCompleteness: number; // default 15
  acquisitionReadiness: number; // default 12
  campaignStructure: number; // default 8
  liquidityOutlook: number; // default 6
  riskProfile: number; // default 10
}

export const DEFAULT_SCORE_WEIGHTS: CategoryWeightConfig = {
  locationQuality: 15,
  demandProfile: 12,
  propertyCharacteristics: 10,
  pricingContext: 12,
  documentationCompleteness: 15,
  acquisitionReadiness: 12,
  campaignStructure: 8,
  liquidityOutlook: 6,
  riskProfile: 10,
};

/**
 * Calculates a deterministic Habibi Intelligence Score (0 - 100)
 * and Data Confidence Score (0 - 100) for a given property slug.
 */
export function calculateHabibiScore(
  slug: string,
  customWeights: CategoryWeightConfig = DEFAULT_SCORE_WEIGHTS,
): HabibiScoreResult {
  const campaign = campaignBySlug(slug);

  const citations: Citation[] = [];
  const missingInputs: string[] = [];

  if (!campaign) {
    return {
      propertySlug: slug,
      propertyName: slug,
      propertyScore: 0,
      dataConfidenceScore: 0,
      summaryVerdict: "Property information not found",
      categories: [],
      missingInputs: ["Property metadata", "Campaign terms"],
      lastUpdated: new Date().toISOString().slice(0, 10),
      methodologyVersion: "v1.0.0-deterministic",
      citations: [],
    };
  }

  citations.push({
    id: `cite-${slug}-meta`,
    sourceType: "property_meta",
    title: `${campaign.name} Metadata Record`,
    url: `/properties/${slug}`,
    snippet: campaign.summary,
  });

  const categories: ScoreCategory[] = [];

  // 1. Location Quality (15%)
  const isOasis = slug === "palmiera-2-oasis";
  const locScore = isOasis ? 88 : 82;
  categories.push({
    key: "locationQuality",
    name: "Location Quality",
    score: locScore,
    weight: customWeights.locationQuality,
    explanation: isOasis
      ? "Prime master-planned luxury villa district in The Oasis by Emaar with strong long-term capital preservation."
      : "Rapidly expanding master community at DAMAC Hills 2 with high park-view rental appeal.",
    supportingSources: ["Masterplan Documentation", "DLD Community Trends"],
    confidence: 85,
  });

  // 2. Demand Profile (12%)
  const demandScore = isOasis ? 85 : 80;
  categories.push({
    key: "demandProfile",
    name: "Demand Profile",
    score: demandScore,
    weight: customWeights.demandProfile,
    explanation: isOasis
      ? "High demand for luxury freehold family villas in master-planned communities."
      : "Steady demand for accessible off-plan 1-bedroom apartments under AED 700k.",
    supportingSources: ["Dubai Rental Index", "Brokerage Market Analysis"],
    confidence: 80,
  });

  // 3. Property Characteristics (10%)
  const charScore = isOasis ? 90 : 84;
  categories.push({
    key: "propertyCharacteristics",
    name: "Property Characteristics",
    score: charScore,
    weight: customWeights.propertyCharacteristics,
    explanation: isOasis
      ? "Spacious 4-bedroom villa layout, 8,267 sqft plot, lagoon view, and high-end finishes."
      : "Efficient 526 sqft 1-bedroom layout with 115 sqft balcony and park views.",
    supportingSources: ["Developer Specifications"],
    confidence: 90,
  });

  // 4. Pricing Context (12%)
  categories.push({
    key: "pricingContext",
    name: "Pricing Context",
    score: isOasis ? 80 : 85,
    weight: customWeights.pricingContext,
    explanation: isOasis
      ? "AED 9.47M reference price aligns with luxury off-plan benchmarks in prime Dubai expansion corridors."
      : "AED 639,000 price presents an accessible entry point with strong potential gross yields.",
    supportingSources: ["Indicative Pricing Assessment"],
    confidence: 75,
  });

  // 5. Documentation Completeness (15%)
  const docCount = campaign.config.approvedImages.length;
  const docScore = docCount > 5 ? 78 : 60;
  if (docCount <= 5) missingInputs.push("Independent Valuation Report", "Final Title Deed SPV Audit");
  categories.push({
    key: "documentationCompleteness",
    name: "Documentation Completeness",
    score: docScore,
    weight: customWeights.documentationCompleteness,
    explanation: `${docCount} verified media assets attached. Legal participation terms and SPV audit structure pending final execution.`,
    supportingSources: ["Campaign Document Checklist"],
    confidence: docCount > 5 ? 75 : 55,
  });

  // 6. Acquisition Readiness (12%)
  categories.push({
    key: "acquisitionReadiness",
    name: "Acquisition Readiness",
    score: 72,
    weight: customWeights.acquisitionReadiness,
    explanation: "Proposed acquisition status. Conditional commitments escrowed on Robinhood Chain until closing conditions are satisfied.",
    supportingSources: ["Habibi Escrow Contract Rules"],
    confidence: 70,
  });

  // 7. Campaign Structure (8%)
  categories.push({
    key: "campaignStructure",
    name: "Campaign Structure",
    score: 88,
    weight: customWeights.campaignStructure,
    explanation: "Strict pull-based refund protection in smart contract if threshold is unmet or acquisition fails.",
    supportingSources: ["HabibiCampaigns Smart Contract"],
    confidence: 95,
  });

  // 8. Liquidity Outlook (6%)
  categories.push({
    key: "liquidityOutlook",
    name: "Liquidity Outlook",
    score: 65,
    weight: customWeights.liquidityOutlook,
    explanation: "Illiquid real estate escrow position during acquisition window. Secondary marketplace subject to governance activation.",
    supportingSources: ["Risk Disclosure Terms"],
    confidence: 80,
  });

  // 9. Risk Profile (10%)
  categories.push({
    key: "riskProfile",
    name: "Risk Profile",
    score: 76,
    weight: customWeights.riskProfile,
    explanation: "Off-plan construction & market price risk mitigated by full pull-based refund policy.",
    supportingSources: ["Risk Factors Disclosure"],
    confidence: 85,
  });

  // Calculate Weighted Property Score
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let totalConfidenceWeighted = 0;

  categories.forEach((cat) => {
    totalWeightedScore += cat.score * (cat.weight / 100);
    totalConfidenceWeighted += cat.confidence * (cat.weight / 100);
    totalWeight += cat.weight;
  });

  const propertyScore = Math.round((totalWeightedScore / (totalWeight / 100)));
  const dataConfidenceScore = Math.round((totalConfidenceWeighted / (totalWeight / 100)));

  let summaryVerdict = "Solid property fundamentals with robust contract refund terms";
  if (propertyScore >= 85) {
    summaryVerdict = "Prime property characteristics with strong location and structural protections";
  } else if (propertyScore < 75) {
    summaryVerdict = "Moderate fundamentals — review acquisition risk disclosures carefully";
  }

  return {
    propertySlug: slug,
    propertyName: campaign.name,
    propertyScore,
    dataConfidenceScore,
    summaryVerdict,
    categories,
    missingInputs,
    lastUpdated: new Date().toISOString().slice(0, 10),
    methodologyVersion: "v1.0.0-deterministic",
    citations,
  };
}
