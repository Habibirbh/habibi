"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, ChevronDown, HelpCircle } from "lucide-react";
import { PropertyScoreBadge } from "./PropertyScoreBadge";
import { useIntelligence } from "./IntelligenceProvider";
import type { PropertyIntelligenceReport, HabibiScoreResult } from "@/lib/intelligence/types";

export function PropertyIntelligenceSection({ propertySlug }: { propertySlug: string }) {
  const { openAssistant, setActivePropertySlug } = useIntelligence();
  const [report, setReport] = useState<PropertyIntelligenceReport | null>(null);
  const [score, setScore] = useState<HabibiScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    setActivePropertySlug(propertySlug);

    async function fetchData() {
      try {
        const [repRes, scoreRes] = await Promise.all([
          fetch(`/api/intelligence/property-report?slug=${propertySlug}`),
          fetch(`/api/intelligence/property-score?slug=${propertySlug}`),
        ]);

        if (repRes.ok) setReport(await repRes.json());
        if (scoreRes.ok) setScore(await scoreRes.json());
      } catch (err) {
        console.error("Failed to load property intelligence:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [propertySlug, setActivePropertySlug]);

  const suggestedQuestions = [
    "Why is this property being considered?",
    "What are the biggest risks?",
    "Explain the proposed acquisition structure.",
    "What happens to my ETH?",
    "When can refunds become available?",
    "What documents should I review?",
  ];

  if (loading) {
    return (
      <div className="mt-12 rounded-3xl border border-line bg-surface p-8 text-center text-muted">
        <Sparkles className="mx-auto h-6 w-6 animate-spin text-lime" />
        <p className="mt-2 text-sm font-medium">Generating Habibi Intelligence analysis…</p>
      </div>
    );
  }

  return (
    <section className="mt-16 border-t border-line pt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-lime/20 px-3 py-1 text-[0.7rem] font-medium text-ink">
              Habibi Intelligence
            </span>
            <span className="text-[0.75rem] text-muted">AI-Assisted Property Analysis</span>
          </div>
          <h2 className="mt-2 font-serif text-3xl text-ink">Property Intelligence Report</h2>
        </div>

        <button
          onClick={() => openAssistant(undefined, propertySlug)}
          className="focus-lime inline-flex items-center gap-2 self-start rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface hover:bg-lime hover:text-ink transition-colors sm:self-auto"
        >
          <Sparkles className="h-4 w-4" /> Ask Habibi Intelligence
        </button>
      </div>

      {/* Score Badge */}
      {score && (
        <div className="mt-8">
          <PropertyScoreBadge scoreResult={score} />
        </div>
      )}

      {/* Report Modules */}
      {report && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Executive Summary & Strengths */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card lg:col-span-2 space-y-6">
            <div>
              <h3 className="font-serif text-xl text-ink border-b border-line pb-3">Executive Summary</h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-muted">{report.executiveSummary}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-line pt-4">
              <div>
                <h4 className="text-[0.78rem] uppercase tracking-wider text-muted font-medium mb-2">
                  Property Strengths
                </h4>
                <ul className="space-y-2 text-[0.84rem] text-ink/90">
                  {report.propertyStrengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 mt-2 rounded-full bg-lime shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[0.78rem] uppercase tracking-wider text-muted font-medium mb-2">
                  Key Acquisition Risks
                </h4>
                <ul className="space-y-2 text-[0.84rem] text-muted">
                  {report.keyRisks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 mt-2 rounded-full bg-[#b4442f] shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Ask Habibi Intelligence Box */}
          <div className="rounded-2xl border border-line bg-bg p-6 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-xl text-ink border-b border-line pb-3">Ask Habibi Intelligence</h3>
              <p className="mt-2 text-[0.8rem] text-muted">
                Select a suggested question to analyze this property:
              </p>

              <div className="mt-4 space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => openAssistant(q, propertySlug)}
                    className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-[0.8rem] font-medium text-ink hover:border-ink hover:bg-lime/20 transition-colors flex items-center justify-between"
                  >
                    <span>{q}</span>
                    <HelpCircle className="h-3.5 w-3.5 text-muted shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-6 text-[0.7rem] text-muted italic">
              AI analysis is informational and may contain errors. Always review property documents.
            </p>
          </div>
        </div>
      )}

      {/* Methodology Section */}
      <div className="mt-8 border-t border-line pt-4">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center gap-2 text-[0.82rem] font-medium text-muted hover:text-ink transition-colors"
        >
          <span>Score methodology & scoring framework</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showMethodology ? "rotate-180" : ""}`} />
        </button>

        {showMethodology && (
          <div className="mt-3 rounded-2xl border border-line bg-surface p-5 text-[0.82rem] text-muted leading-relaxed space-y-2">
            <p className="font-medium text-ink">Habibi Intelligence Scoring Framework (v1.0.0)</p>
            <p>
              Scores are calculated deterministically across 9 categories: Location Quality (15%), Demand Profile (12%), Property Quality (10%), Pricing Context (12%), Documentation Completeness (15%), Acquisition Readiness (12%), Campaign Structure (8%), Liquidity (6%), Risk Profile (10%).
            </p>
            <p>
              Data Confidence Score is calculated independently based on the number and freshness of verified documents and on-chain records available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
