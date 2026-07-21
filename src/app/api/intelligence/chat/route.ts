import { NextResponse } from "next/server";
import { generateIntelligenceResponse } from "@/lib/intelligence/aiProvider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, propertySlug, userWallet, hasPortfolioConsent } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload: messages array required." }, { status: 400 });
    }

    const result = await generateIntelligenceResponse({
      messages,
      propertySlug,
      userWallet,
      hasPortfolioConsent,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Habibi Intelligence API Error:", error);
    return NextResponse.json(
      { error: "Habibi Intelligence service encountered an issue processing your request." },
      { status: 500 },
    );
  }
}
