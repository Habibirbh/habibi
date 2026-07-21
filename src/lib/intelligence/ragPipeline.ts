import type { IntelligenceDocumentChunk, Citation } from "./types";
import { habibiPlatformGlossary, uaeMarketBenchmarks } from "./knowledgeBase";

/** In-memory document chunk store for RAG indexing & citation matching */
export const initialDocumentChunks: IntelligenceDocumentChunk[] = [
  // Palmiera 2 Documents
  {
    chunkId: "doc-palm-1",
    documentId: "doc-palmiera-overview",
    propertySlug: "palmiera-2-oasis",
    title: "Palmiera 2 Overview & Specifications",
    documentType: "overview",
    pageNumber: 1,
    sectionTitle: "Property Summary",
    content: "Palmiera 2 in The Oasis masterplan by Emaar Properties features a 4-bedroom lagoon-facing luxury villa with 8,267 sqft plot and 5,627 sqft built-up area. Target completion is Q2 2028.",
    accessLevel: "public",
  },
  {
    chunkId: "doc-palm-2",
    documentId: "doc-palmiera-terms",
    propertySlug: "palmiera-2-oasis",
    title: "Palmiera 2 Escrow & Participation Terms",
    documentType: "terms",
    pageNumber: 4,
    sectionTitle: "Escrow & Refund Conditions",
    content: "All campaign contributions are deposited directly into the HabibiCampaigns smart contract escrow. If the campaign fails to reach the 24 ETH minimum threshold by the closing time, 100% of contributed ETH becomes pull-refundable by participants.",
    accessLevel: "public",
  },
  {
    chunkId: "doc-palm-3",
    documentId: "doc-palmiera-risk",
    propertySlug: "palmiera-2-oasis",
    title: "Palmiera 2 Risk Disclosure",
    documentType: "risk",
    pageNumber: 2,
    sectionTitle: "Acquisition Risk",
    content: "This property is a proposed acquisition target. Participation units represent contract-recorded escrow interests prior to acquisition closing, not standalone UAE land title deed.",
    accessLevel: "public",
  },
  // ELO Damac Documents
  {
    chunkId: "doc-elo-1",
    documentId: "doc-elo-overview",
    propertySlug: "elo-damac",
    title: "ELO DAMAC Hills 2 Apartment Overview",
    documentType: "overview",
    pageNumber: 1,
    sectionTitle: "Unit Details",
    content: "ELO 1 at DAMAC Hills 2 is a 1-bedroom apartment featuring 526 sqft total built-up area including a 115 sqft balcony with park views. Target handover is Q4 2026.",
    accessLevel: "public",
  },
  {
    chunkId: "doc-elo-2",
    documentId: "doc-elo-terms",
    propertySlug: "elo-damac",
    title: "ELO DAMAC Hills 2 Campaign Terms",
    documentType: "terms",
    pageNumber: 3,
    sectionTitle: "Minimum Unit Size",
    content: "The minimum contribution for ELO DAMAC Hills 2 is 0.01 ETH (~$30 USD equivalent) representing 1 participation unit in the escrow vault.",
    accessLevel: "public",
  },
];

/**
 * Searches the RAG document store for relevant chunks matching a user query
 * and returns matched snippets with citations.
 */
export function queryRagChunks(
  query: string,
  propertySlug?: string,
  limit: number = 4,
): { chunks: IntelligenceDocumentChunk[]; citations: Citation[] } {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  let eligible = initialDocumentChunks;
  if (propertySlug) {
    eligible = eligible.filter((c) => c.propertySlug === propertySlug);
  }

  const scored = eligible.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const titleLower = chunk.title.toLowerCase();

    terms.forEach((term) => {
      if (contentLower.includes(term)) score += 2;
      if (titleLower.includes(term)) score += 3;
    });

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const matched = scored
    .filter((item) => item.score > 0 || !propertySlug)
    .slice(0, limit)
    .map((item) => item.chunk);

  const citations: Citation[] = matched.map((chunk) => ({
    id: `cite-${chunk.chunkId}`,
    sourceType: "document",
    title: chunk.title,
    sectionOrPage: `Section: ${chunk.sectionTitle} (Page ${chunk.pageNumber ?? 1})`,
    snippet: chunk.content,
  }));

  // Add platform & market citations if relevant keywords present
  if (query.toLowerCase().includes("escrow") || query.toLowerCase().includes("refund")) {
    citations.push({
      id: "cite-glossary-escrow",
      sourceType: "platform_docs",
      title: "Habibi Escrow & Refund Architecture",
      snippet: habibiPlatformGlossary["Pull-Based Refund"],
    });
  }

  if (query.toLowerCase().includes("oasis") || query.toLowerCase().includes("damac")) {
    const bench = uaeMarketBenchmarks.find((b) => query.toLowerCase().includes(b.community.toLowerCase()));
    if (bench) {
      citations.push({
        id: `cite-bench-${bench.community.toLowerCase().replace(/\s+/g, "-")}`,
        sourceType: "market_data",
        title: `${bench.community} Market Benchmarks (${bench.lastUpdated})`,
        snippet: `Avg Price: AED ${bench.avgPricePerSqftAed}/sqft · Expected Yield: ${bench.expectedGrossYieldPercent}%`,
      });
    }
  }

  return { chunks: matched, citations };
}
