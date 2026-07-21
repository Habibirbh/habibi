import type { IntelligenceDocumentChunk, Citation } from "./types";
import type { IntelligenceIntent } from "./intentClassifier";
import { initialDocumentChunks } from "./ragPipeline";
import { habibiPlatformGlossary } from "./knowledgeBase";

/**
 * Strict RAG retriever that filters and scores document chunks strictly based on detected intent
 * and entity context, refusing irrelevant chunks and unverified citations.
 */
export function queryStrictRag(
  query: string,
  intent: IntelligenceIntent,
): { chunks: IntelligenceDocumentChunk[]; citations: Citation[] } {
  const qLower = query.toLowerCase();

  // Strict intent filtering
  let pool = initialDocumentChunks;

  // Filter by property if propertySlug entity is specified AND intent is property/document specific
  if (intent.entities.propertySlug && intent.intent !== "ESCROW_EXPLANATION" && intent.intent !== "CAMPAIGN_FAILURE" && intent.intent !== "PLATFORM_QUESTION") {
    pool = pool.filter((c) => c.propertySlug === intent.entities.propertySlug);
  }

  // Filter chunk document types based on intent
  if (intent.intent === "CAMPAIGN_FAILURE" || intent.intent === "REFUND_ELIGIBILITY" || intent.intent === "ESCROW_EXPLANATION") {
    pool = pool.filter((c) => c.documentType === "terms" || c.documentType === "escrow" || c.documentType === "risk");
  } else if (intent.intent === "PROPERTY_RISKS" || intent.intent === "CAMPAIGN_RISKS") {
    pool = pool.filter((c) => c.documentType === "risk" || c.documentType === "terms");
  } else if (intent.intent === "PROPERTY_SUMMARY") {
    pool = pool.filter((c) => c.documentType === "overview");
  }

  // Calculate similarity score
  const queryTerms = qLower.split(/\s+/).filter((t) => t.length > 2);
  const scored = pool.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const titleLower = chunk.title.toLowerCase();

    queryTerms.forEach((t) => {
      if (contentLower.includes(t)) score += 2;
      if (titleLower.includes(t)) score += 3;
    });
    return { chunk, score };
  });

  // Relevance Threshold cutoff (score >= 4 required for general fallback)
  const domainTerms = ["property", "campaign", "escrow", "refund", "eth", "villa", "apartment", "damac", "emaar", "oasis", "risk", "unit", "contract"];
  const hasDomainTerm = queryTerms.some((t) => domainTerms.includes(t));

  const relevantChunks = scored
    .filter((s) => s.score >= 4 && hasDomainTerm)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.chunk);

  // Build validated citations ONLY for relevant chunks
  const citations: Citation[] = relevantChunks.map((chunk) => ({
    id: `cite-${chunk.chunkId}`,
    sourceType: "document",
    title: chunk.title,
    sectionOrPage: `Section: ${chunk.sectionTitle} (Page ${chunk.pageNumber ?? 1})`,
    snippet: chunk.content,
  }));

  // Add platform docs citation ONLY if intent demands platform escrow / refund rules
  if (intent.intent === "ESCROW_EXPLANATION" || intent.intent === "CAMPAIGN_FAILURE" || intent.intent === "REFUND_ELIGIBILITY") {
    citations.push({
      id: "cite-glossary-escrow",
      sourceType: "platform_docs",
      title: "Habibi Smart Contract Escrow Terms",
      snippet: habibiPlatformGlossary["Pull-Based Refund"],
    });
  }

  return { chunks: relevantChunks, citations };
}
