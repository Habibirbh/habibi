import { describe, it, expect } from "vitest";
import { generateIntelligenceResponse } from "./aiProvider";
import { classifyIntent } from "./intentClassifier";

describe("Habibi Intelligence Pipeline Evaluation", () => {

  it("1. 'What happens if a campaign fails?' classifies as CAMPAIGN_FAILURE and returns failure refund rules", async () => {
    const intent = classifyIntent("What happens if a campaign fails?");
    expect(intent.intent).toBe("CAMPAIGN_FAILURE");

    const res = await generateIntelligenceResponse({
      messages: [{ role: "user", content: "What happens if a campaign fails?" }],
    });

    expect(res.reply).toContain("100% of your contributed ETH becomes pull-refundable");
    expect(res.citations.some((c) => c.sourceType === "platform_docs")).toBe(true);
  });

  it("2. 'Explain the escrow structure.' classifies as ESCROW_EXPLANATION and does not dump property listing copy", async () => {
    const intent = classifyIntent("Explain the escrow structure.");
    expect(intent.intent).toBe("ESCROW_EXPLANATION");

    const res = await generateIntelligenceResponse({
      messages: [{ role: "user", content: "Explain the escrow structure." }],
    });

    expect(res.reply).toContain("Robinhood Chain");
    expect(res.reply).not.toContain("4-bedroom");
    expect(res.reply).not.toContain("5,627 sqft");
  });

  it("3. 'Has this property already been acquired?' returns accurate acquisition status", async () => {
    const intent = classifyIntent("Has this property already been acquired?", "palmiera-2-oasis");
    expect(intent.intent).toBe("ACQUISITION_STATUS");

    const res = await generateIntelligenceResponse({
      messages: [{ role: "user", content: "Has this property already been acquired?" }],
      propertySlug: "palmiera-2-oasis",
    });

    expect(res.reply).toContain("has not yet been acquired");
    expect(res.reply).toContain("proposed acquisition target");
  });

  it("4. 'What are the main property risks?' classifies as PROPERTY_RISKS", async () => {
    const intent = classifyIntent("What are the main property risks?", "palmiera-2-oasis");
    expect(intent.intent).toBe("PROPERTY_RISKS");

    const res = await generateIntelligenceResponse({
      messages: [{ role: "user", content: "What are the main property risks?" }],
      propertySlug: "palmiera-2-oasis",
    });

    expect(res.reply).toContain("Proposed Acquisition Target");
    expect(res.reply).toContain("Illiquidity");
  });

  it("5. Refuses when unsupported question asked", async () => {
    const res = await generateIntelligenceResponse({
      messages: [{ role: "user", content: "What is the recipe for chocolate cake?" }],
    });

    expect(res.reply).toContain("I do not have verified documentation to answer that specific question accurately");
  });
});
