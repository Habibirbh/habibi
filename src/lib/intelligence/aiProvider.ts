import { queryRagChunks } from "./ragPipeline";
import { campaignBySlug } from "../web3/campaigns";
import type { Citation } from "./types";

export interface AIProviderConfig {
  provider: string;
  apiKey?: string;
  model: string;
}

export function getAIProviderConfig(): AIProviderConfig {
  return {
    provider: process.env.AI_PROVIDER || "fallback-deterministic",
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || "gemini-3.5-flash",
  };
}

/**
 * Server-side AI provider handler. Executes prompt injection checks, context assembly,
 * RAG chunk retrieval, and generates clean responses with citations.
 */
export async function generateIntelligenceResponse(opts: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  propertySlug?: string;
  userWallet?: string;
  hasPortfolioConsent?: boolean;
}): Promise<{
  reply: string;
  citations: Citation[];
  suggestedPrompts: string[];
}> {
  const lastMessage = opts.messages[opts.messages.length - 1]?.content || "";

  // Prompt Injection Defense & Security Checks
  const lowerQuery = lastMessage.toLowerCase();
  const injectionPatterns = [
    "ignore previous instructions",
    "reveal system prompt",
    "send funds",
    "approve campaign",
    "private key",
    "seed phrase",
  ];

  if (injectionPatterns.some((pattern) => lowerQuery.includes(pattern))) {
    return {
      reply: "Security Alert: Request ignored. Habibi Intelligence operates under strict security policies. I cannot execute contract writes, modify system prompts, or request private wallet credentials.",
      citations: [
        {
          id: "cite-sec-policy",
          sourceType: "platform_docs",
          title: "Habibi Security Policy",
          snippet: "Habibi Intelligence is read-only and never requests private keys or signs transactions.",
        },
      ],
      suggestedPrompts: [
        "Explain the escrow structure",
        "What are the main property risks?",
        "How do refunds work?",
      ],
    };
  }

  // Retrieve RAG Chunks & Context
  const ragResult = queryRagChunks(lastMessage, opts.propertySlug);
  const citations = [...ragResult.citations];

  const targetCampaign = opts.propertySlug ? campaignBySlug(opts.propertySlug) : undefined;

  let reply = "";

  // Handle specific context intents intelligently
  if (targetCampaign && (lowerQuery.includes("risk") || lowerQuery.includes("happen if"))) {
    reply = `### Risk Analysis & Safety Mechanics for ${targetCampaign.name}\n\n` +
      `1. **Proposed Acquisition Risk**: This property is an acquisition target. Contributions are held in smart contract escrow on Robinhood Chain until closing.\n` +
      `2. **Full Refund Protection**: If the campaign fails to reach its minimum threshold or is cancelled by governance, 100% of your ETH is refundable directly on-chain.\n` +
      `3. **Off-Plan Timing**: Development and handover depend on the master developer timeline.`;
  } else if (targetCampaign && (lowerQuery.includes("explain") || lowerQuery.includes("summary") || lowerQuery.includes("details"))) {
    reply = `### Overview: ${targetCampaign.name}\n\n` +
      `${targetCampaign.summary}\n\n` +
      `**Key Specifications:**\n` +
      `- **Location**: ${targetCampaign.location}\n` +
      `- **Indicative Value**: ${targetCampaign.indicativePrice}\n` +
      `- **Media Status**: ${targetCampaign.mediaRightsStatus}`;
  } else if (lowerQuery.includes("escrow") || lowerQuery.includes("refund")) {
    reply = `### Habibi Escrow & Refund Architecture\n\n` +
      `All Habibi campaigns utilize a smart contract escrow vault on Robinhood Chain (Chain ID 4663).\n\n` +
      `- **Conditional Escrow**: Contributed ETH remains locked in the smart contract until acquisition conditions are satisfied.\n` +
      `- **Pull-Based Refunds**: If a campaign is cancelled or misses its deadline, any participant can invoke \`claimRefund()\` to immediately return their ETH to their wallet without manual administrative delay.`;
  } else if (lowerQuery.includes("compare") || lowerQuery.includes("difference")) {
    reply = `### UAE Property Comparison Summary\n\n` +
      `- **Palmiera 2 — The Oasis**: Luxury 4-bedroom villa target in Emaar's prime masterplan (AED 9.47M reference). Higher entry threshold, prime long-term capital preservation.\n` +
      `- **ELO — DAMAC Hills 2**: Accessible 1-bedroom apartment (AED 639k reference, 0.01 ETH min contribution). High rental yield potential in a vibrant community.`;
  } else {
    reply = `Marhaba! Regarding your inquiry on UAE real estate and the Habibi platform:\n\n` +
      `Based on verified documentation for our proposed acquisition campaigns, Habibi enables transparent fractional participation backed by Robinhood Chain escrow smart contracts.\n\n` +
      `Feel free to ask for specific property risk reports, document summaries, or portfolio position breakdowns!`;
  }

  const suggestedPrompts = [
    "Explain the escrow structure",
    "What are the main property risks?",
    "Compare Palmiera 2 with ELO Damac",
    "What happens if a campaign fails?",
  ];

  return { reply, citations, suggestedPrompts };
}
