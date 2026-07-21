"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import type { HabibiScoreResult } from "@/lib/intelligence/types";

export function PropertyScoreBadge({ scoreResult }: { scoreResult: HabibiScoreResult }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="text-[0.68rem] uppercase tracking-wider text-muted font-medium">
            Habibi Intelligence Score
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-4xl font-bold text-ink">{scoreResult.propertyScore}</span>
            <span className="text-sm font-medium text-muted">/ 100</span>
          </div>
          <p className="mt-1 text-[0.82rem] font-medium text-ink/80">{scoreResult.summaryVerdict}</p>
        </div>

        {/* Data Confidence Badge (Separated from Property Score) */}
        <div className="rounded-xl border border-line bg-bg p-3 text-right">
          <span className="text-[0.66rem] uppercase tracking-wider text-muted font-medium block">
            Data Confidence
          </span>
          <span className="font-serif text-xl font-bold text-ink">{scoreResult.dataConfidenceScore} / 100</span>
          <span className="mt-0.5 block text-[0.7rem] text-muted">Based on verified sources</span>
        </div>
      </div>

      {/* Category Score Breakdown */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scoreResult.categories.map((cat) => (
          <div key={cat.key} className="rounded-xl border border-line/60 bg-bg/50 p-3">
            <div className="flex items-center justify-between text-[0.78rem]">
              <span className="font-medium text-ink">{cat.name}</span>
              <span className="font-serif font-bold text-ink">{cat.score} / 100</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full bg-lime rounded-full" style={{ width: `${cat.score}%` }} />
            </div>
            <p className="mt-1.5 text-[0.72rem] text-muted leading-snug">{cat.explanation}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-line pt-3 flex items-center justify-between text-[0.7rem] text-muted">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-lime" /> Methodology Version: {scoreResult.methodologyVersion}
        </span>
        <span>Last updated: {scoreResult.lastUpdated}</span>
      </div>
    </div>
  );
}
