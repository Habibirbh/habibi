import { classifyIntent, type IntelligenceIntent } from "./intentClassifier";
import { queryStrictRag } from "./strictRag";
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
 * Server-side AI provider handler. Executes intent classification, strict RAG retrieval,
 * context assembly, and generates concise, clean responses without exposed raw markdown markers.
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
  diagnostics?: {
    intent: IntelligenceIntent;
    retrievedChunkIds: string[];
  };
}> {
  const lastMessage = opts.messages[opts.messages.length - 1]?.content || "";

  // 1. Security & Prompt Injection Defense
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

  // 2. Classify User Intent & Extract Entities
  const intent = classifyIntent(lastMessage, opts.propertySlug);
  const targetSlug = intent.entities.propertySlug || opts.propertySlug;
  const targetCampaign = targetSlug ? campaignBySlug(targetSlug) : undefined;

  // 3. Strict RAG Chunk Retrieval & Citation Assembly
  const ragResult = queryStrictRag(lastMessage, intent);
  const citations = [...ragResult.citations];

  let reply = "";
  let suggestedPrompts: string[] = [];

  // 4. Intent-Driven Response Generation (Direct & Accurate, No Raw Markdown Heading Clutter)
  switch (intent.intent) {
    case "CAMPAIGN_FAILURE":
      reply =
        "If a campaign fails to reach its minimum threshold by the closing deadline, or if the campaign is cancelled before acquisition authorization:\n\n" +
        "1. Contributions are locked in the smart contract escrow vault until funding closes.\n" +
        "2. 100% of your contributed ETH becomes pull-refundable directly on-chain.\n" +
        "3. You can claim your refund anytime from your Portfolio page with no administrative delays or penalties.";
      suggestedPrompts = [
        "How do I claim a refund?",
        "Explain the escrow structure",
        "What are the main property risks?",
      ];
      break;

    case "ESCROW_EXPLANATION":
      reply =
        "Habibi utilizes a smart contract escrow vault on Robinhood Chain (Chain ID 4663) to secure conditional commitments:\n\n" +
        "1. Contributed funds are deposited directly into the smart contract escrow, not sent to a seller or platform balance.\n" +
        "2. Funds remain locked until all acquisition authorization conditions are met by the multisig governance.\n" +
        "3. If acquisition conditions fail, pull-based refunds open automatically for all participants.";
      suggestedPrompts = [
        "What happens if a campaign fails?",
        "Can I claim a refund?",
        "What are the main property risks?",
      ];
      break;

    case "REFUND_ELIGIBILITY":
      reply =
        "Refund eligibility on Habibi is enforced directly by the smart contract:\n\n" +
        "• You are eligible for a 100% refund if the campaign fails to reach its minimum threshold or is cancelled.\n" +
        "• To claim your refund, connect your wallet, navigate to your Portfolio page, and click 'Claim refund'.\n" +
        "• Refunds are pull-based and processed on-chain in a single transaction.";
      suggestedPrompts = [
        "What happens if a campaign fails?",
        "Explain the escrow structure",
        "How would this affect my portfolio?",
      ];
      break;

    case "CONTRIBUTION_FLOW":
      reply =
        "When you contribute ETH to a campaign:\n\n" +
        "1. Your ETH is transferred directly to the campaign smart contract escrow vault on Robinhood Chain.\n" +
        "2. You receive contract-recorded proposed participation units corresponding to your contribution amount.\n" +
        "3. Your funds remain in escrow until either acquisition conditions are authorized or refunds are opened.";
      suggestedPrompts = [
        "Explain the escrow structure",
        "What happens if a campaign fails?",
        "What are the main property risks?",
      ];
      break;

    case "ACQUISITION_STATUS":
      if (targetCampaign) {
        reply =
          `No, ${targetCampaign.name} has not yet been acquired.\n\n` +
          "It is currently a proposed acquisition target raising conditional commitments in smart contract escrow. Final acquisition requires meeting the funding threshold, satisfactory due diligence, and signed multisig authorization.";
      } else {
        reply =
          "Habibi properties in active campaigns are proposed acquisition targets and are not yet acquired. Funds remain in smart contract escrow until acquisition closing conditions are met.";
      }
      suggestedPrompts = [
        "What is the funding target?",
        "What happens if a campaign fails?",
        "Explain the escrow structure",
      ];
      break;

    case "FUNDING_STATUS":
      if (targetCampaign) {
        reply =
          `Funding Status for ${targetCampaign.name}:\n\n` +
          `• Indicative Price: ${targetCampaign.indicativePrice}\n` +
          "• Escrow Vault: Smart contract managed on Robinhood Chain (Chain ID 4663)\n" +
          "• Status: Active conditional funding campaign.";
      } else {
        reply = "Active campaigns are open for conditional contributions on Robinhood Chain.";
      }
      suggestedPrompts = [
        "What happens if a campaign fails?",
        "Explain the escrow structure",
        "What are the main property risks?",
      ];
      break;

    case "PROPERTY_RISKS":
    case "CAMPAIGN_RISKS":
      if (targetCampaign) {
        reply =
          `Key Risk Disclosures for ${targetCampaign.name}:\n\n` +
          "1. Proposed Acquisition Target: The property is not yet acquired and remains subject to seller availability, due diligence, and closing conditions.\n" +
          "2. Real Estate Illiquidity: Participation units represent contract-recorded escrow interests prior to acquisition close, not standalone land title deeds.\n" +
          "3. Off-Plan Timeline: Construction completion and handover depend on the master developer timeline.";
      } else {
        reply =
          "Key Risks across Habibi proposed acquisition campaigns:\n\n" +
          "1. Proposed Acquisition Risk: Properties are acquisition targets and conditional until closing.\n" +
          "2. Illiquidity: Participation units are escrow interests during the campaign period.\n" +
          "3. Master Developer Timeline: Handover depends on off-plan development timelines.";
      }
      suggestedPrompts = [
        "What happens if a campaign fails?",
        "Explain the escrow structure",
        "Can I claim a refund?",
      ];
      break;

    case "PROPERTY_SUMMARY":
      if (targetCampaign) {
        reply =
          `Summary of ${targetCampaign.name}:\n\n` +
          `${targetCampaign.summary}\n\n` +
          `• Location: ${targetCampaign.location}\n` +
          `• Indicative Price: ${targetCampaign.indicativePrice}\n` +
          `• Media Rights: ${targetCampaign.mediaRightsStatus}`;
      } else {
        reply = "Habibi presents curated UAE property acquisition targets with structured documentation and smart contract escrow protection.";
      }
      suggestedPrompts = [
        "What are the main property risks?",
        "Explain the escrow structure",
        "Compare this property with another property",
      ];
      break;

    case "PROPERTY_COMPARISON":
      reply =
        "UAE Property Comparison Summary:\n\n" +
        "• Palmiera 2 — The Oasis: Luxury 4-bedroom villa target in Emaar's prime masterplan (AED 9.47M reference). Higher entry threshold, prime long-term capital preservation.\n\n" +
        "• ELO — DAMAC Hills 2: Accessible 1-bedroom apartment (AED 639k reference, 0.01 ETH min contribution). High prospective rental yield in an active community.\n\n" +
        "Both campaigns feature 100% smart contract escrow refund protection on Robinhood Chain.";
      suggestedPrompts = [
        "Explain the escrow structure",
        "What happens if a campaign fails?",
        "What are the main property risks?",
      ];
      break;

    case "PORTFOLIO_SUMMARY":
    case "PORTFOLIO_POSITION":
      reply =
        "Your Habibi portfolio tracks your conditional commitments in active campaign escrow vaults and any finalized property interests on Robinhood Chain.\n\n" +
        "If any of your committed campaigns fail to reach their target or are cancelled, you can claim your 100% ETH refund directly from the Portfolio tab.";
      suggestedPrompts = [
        "How do refunds work?",
        "Explain the escrow structure",
        "What happens if a campaign fails?",
      ];
      break;

    default:
      if (ragResult.chunks.length > 0 && ragResult.citations.length > 0) {
        reply =
          `Based on verified campaign documentation:\n\n` +
          `${ragResult.chunks[0].content}`;
      } else {
        reply =
          "I do not have verified documentation to answer that specific question accurately.\n\n" +
          "Please ask about property specifications, escrow rules, refund eligibility, or campaign risk disclosures.";
      }
      suggestedPrompts = [
        "Explain the escrow structure",
        "What happens if a campaign fails?",
        "What are the main property risks?",
      ];
      break;
  }

  return {
    reply,
    citations,
    suggestedPrompts,
    diagnostics: {
      intent,
      retrievedChunkIds: ragResult.chunks.map((c) => c.chunkId),
    },
  };
}
