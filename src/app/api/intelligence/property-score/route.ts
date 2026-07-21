import { NextResponse } from "next/server";
import { calculateHabibiScore } from "@/lib/intelligence/scoringEngine";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "palmiera-2-oasis";

  const scoreResult = calculateHabibiScore(slug);
  return NextResponse.json(scoreResult);
}
