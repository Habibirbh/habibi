export type IntelligenceIntentType =
  | "CAMPAIGN_FAILURE"
  | "ESCROW_EXPLANATION"
  | "REFUND_ELIGIBILITY"
  | "CONTRIBUTION_FLOW"
  | "ACQUISITION_STATUS"
  | "FUNDING_STATUS"
  | "PROPERTY_SUMMARY"
  | "PROPERTY_RISKS"
  | "CAMPAIGN_RISKS"
  | "DOCUMENT_SUMMARY"
  | "DOCUMENT_QUESTION"
  | "OWNERSHIP_STRUCTURE"
  | "PORTFOLIO_SUMMARY"
  | "PORTFOLIO_POSITION"
  | "PROPERTY_COMPARISON"
  | "MARKET_QUESTION"
  | "PLATFORM_QUESTION"
  | "TRANSACTION_STATUS"
  | "UNKNOWN";

export interface IntelligenceIntent {
  intent: IntelligenceIntentType;
  confidence: number;
  entities: {
    propertySlug?: string;
    campaignId?: string;
    documentId?: string;
    transactionHash?: string;
    comparisonPropertySlugs?: string[];
  };
  requiresOnchainData: boolean;
  requiresDocumentRetrieval: boolean;
  requiresPortfolioContext: boolean;
  requiresMarketData: boolean;
}

/**
 * Deterministically classifies user intent and extracts entities.
 */
export function classifyIntent(query: string, currentPropertySlug?: string): IntelligenceIntent {
  const q = query.toLowerCase().trim();

  // Extract entities
  let propertySlug = currentPropertySlug;
  if (q.includes("palmiera") || q.includes("oasis")) {
    propertySlug = "palmiera-2-oasis";
  } else if (q.includes("elo") || q.includes("damac")) {
    propertySlug = "elo-damac";
  }

  const comparisonSlugs: string[] = [];
  if (q.includes("compare") || q.includes("versus") || q.includes("vs") || q.includes("difference")) {
    if (q.includes("palmiera") || q.includes("oasis")) comparisonSlugs.push("palmiera-2-oasis");
    if (q.includes("elo") || q.includes("damac")) comparisonSlugs.push("elo-damac");
    if (comparisonSlugs.length === 0) {
      comparisonSlugs.push("palmiera-2-oasis", "elo-damac");
    }
  }

  // Intent rules
  if (q.includes("compare") || q.includes("versus") || q.includes("vs") || q.includes("difference")) {
    return {
      intent: "PROPERTY_COMPARISON",
      confidence: 0.95,
      entities: { propertySlug, comparisonPropertySlugs: comparisonSlugs },
      requiresOnchainData: true,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: true,
    };
  }

  if (q.includes("fail") || q.includes("unmet") || q.includes("deadline passes") || q.includes("doesn't reach")) {
    return {
      intent: "CAMPAIGN_FAILURE",
      confidence: 0.95,
      entities: { propertySlug },
      requiresOnchainData: true,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  if (q.includes("escrow") || q.includes("vault") || q.includes("smart contract hold")) {
    return {
      intent: "ESCROW_EXPLANATION",
      confidence: 0.95,
      entities: { propertySlug },
      requiresOnchainData: true,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  if (q.includes("refund") || q.includes("get my money back") || q.includes("claim")) {
    return {
      intent: "REFUND_ELIGIBILITY",
      confidence: 0.92,
      entities: { propertySlug },
      requiresOnchainData: true,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: true,
      requiresMarketData: false,
    };
  }

  if (q.includes("happen to my eth") || q.includes("after i contribute") || q.includes("contribute")) {
    return {
      intent: "CONTRIBUTION_FLOW",
      confidence: 0.9,
      entities: { propertySlug },
      requiresOnchainData: true,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  if (q.includes("already been acquired") || q.includes("acquired") || q.includes("acquisition status")) {
    return {
      intent: "ACQUISITION_STATUS",
      confidence: 0.92,
      entities: { propertySlug },
      requiresOnchainData: true,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  if (q.includes("funding target") || q.includes("threshold") || q.includes("how much raised")) {
    return {
      intent: "FUNDING_STATUS",
      confidence: 0.92,
      entities: { propertySlug },
      requiresOnchainData: true,
      requiresDocumentRetrieval: false,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  if (q.includes("risk")) {
    return {
      intent: q.includes("property") ? "PROPERTY_RISKS" : "CAMPAIGN_RISKS",
      confidence: 0.9,
      entities: { propertySlug },
      requiresOnchainData: false,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  if (q.includes("document") || q.includes("terms") || q.includes("agreement") || q.includes("title")) {
    return {
      intent: "DOCUMENT_QUESTION",
      confidence: 0.88,
      entities: { propertySlug },
      requiresOnchainData: false,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  if (q.includes("portfolio") || q.includes("my positions") || q.includes("my commitments")) {
    return {
      intent: "PORTFOLIO_SUMMARY",
      confidence: 0.9,
      entities: {},
      requiresOnchainData: true,
      requiresDocumentRetrieval: false,
      requiresPortfolioContext: true,
      requiresMarketData: false,
    };
  }

  if (q.includes("summarize") || q.includes("explain this property") || q.includes("tell me about")) {
    return {
      intent: "PROPERTY_SUMMARY",
      confidence: 0.88,
      entities: { propertySlug },
      requiresOnchainData: false,
      requiresDocumentRetrieval: true,
      requiresPortfolioContext: false,
      requiresMarketData: false,
    };
  }

  return {
    intent: "PLATFORM_QUESTION",
    confidence: 0.6,
    entities: { propertySlug },
    requiresOnchainData: false,
    requiresDocumentRetrieval: false,
    requiresPortfolioContext: false,
    requiresMarketData: false,
  };
}
