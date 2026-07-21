/**
 * Core type definitions for Habibi Intelligence AI suite.
 */

export interface Citation {
  id: string;
  sourceType: "property_meta" | "campaign_contract" | "escrow_contract" | "onchain_event" | "document" | "market_data" | "platform_docs";
  title: string;
  sectionOrPage?: string;
  url?: string;
  snippet?: string;
}

export interface ScoreCategory {
  key: string;
  name: string;
  score: number; // 0 - 100
  weight: number; // percentage (e.g. 15 for 15%)
  explanation: string;
  supportingSources: string[];
  confidence: number; // 0 - 100
}

export interface HabibiScoreResult {
  propertySlug: string;
  propertyName: string;
  propertyScore: number; // 0 - 100
  dataConfidenceScore: number; // 0 - 100
  summaryVerdict: string;
  categories: ScoreCategory[];
  missingInputs: string[];
  lastUpdated: string;
  methodologyVersion: string;
  citations: Citation[];
}

export interface PropertyIntelligenceReport {
  propertySlug: string;
  generatedTimestamp: string;
  dataFreshness: string;
  confidenceLevel: number;
  sourcesUsed: Citation[];
  missingInformation: string[];
  executiveSummary: string;
  propertyStrengths: string[];
  keyRisks: string[];
  locationAnalysis: string;
  rentalDemandContext: string;
  supplyContext: string;
  acquisitionComplexity: string;
  fundingStatus: string;
  documentationCompleteness: string;
  liquidityConsiderations: string;
  portfolioSuitability: string;
  questionsToReview: string[];
  status: "Draft" | "Review" | "Approved" | "Archived";
}

export interface IntelligenceChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: Citation[];
  suggestedPrompts?: string[];
  isStreaming?: boolean;
}

export interface PropertyComparisonResult {
  propertyIds: string[];
  categoryComparison: Array<{
    category: string;
    values: Record<string, string>;
  }>;
  majorDifferences: string[];
  strengthsByProperty: Record<string, string[]>;
  risksByProperty: Record<string, string[]>;
  suitabilityContexts: Array<{
    persona: string;
    recommendedSlug: string;
    reasoning: string;
  }>;
  confidence: number;
  citations: Citation[];
  comparisonSummary: string;
}

export interface IntelligenceDocumentChunk {
  chunkId: string;
  documentId: string;
  propertySlug: string;
  title: string;
  documentType: "overview" | "valuation" | "terms" | "escrow" | "risk" | "spv" | "due_diligence" | "rental";
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
  accessLevel: "public" | "admin";
}

export interface DocumentAnalysisResult {
  documentId: string;
  title: string;
  summary: string;
  keyClauses: string[];
  financialValues: Record<string, string>;
  importantDates: string[];
  participantObligations: string[];
  platformObligations: string[];
  refundConditions: string[];
  transferRestrictions: string[];
  riskFlags: string[];
  missingInformation: string[];
  questionsToAsk: string[];
  citations: Citation[];
}

export interface PortfolioIntelligenceAnalysis {
  walletAddress?: string;
  hasConsent: boolean;
  geographicAllocation: Array<{ emirate: string; percentage: number }>;
  campaignStageDistribution: Array<{ stage: string; count: number; valueWei: string }>;
  propertyTypeAllocation: Array<{ category: string; percentage: number }>;
  totalCommittedEth: string;
  refundablePositionsCount: number;
  finalizedInterestsCount: number;
  observations: string[];
  suggestions: string[];
  disclaimer: string;
}
