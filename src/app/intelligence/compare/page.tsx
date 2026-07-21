"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { Sparkles } from "lucide-react";
import type { PropertyComparisonResult } from "@/lib/intelligence/types";

export default function PropertyComparePage() {
  const [data, setData] = useState<PropertyComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComparison() {
      try {
        const res = await fetch("/api/intelligence/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: ["palmiera-2-oasis", "elo-damac"] }),
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error("Failed to load comparison:", e);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-bg py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-lime/20 px-3 py-1 text-[0.7rem] font-medium text-ink">
              Property Comparison Suite
            </span>
          </div>
          <h1 className="mt-3 font-serif text-4xl text-ink">Compare Habibi Properties</h1>
          <p className="mt-2 text-base text-muted max-w-2xl">
            Side-by-side technical, financial, and risk comparison across verified UAE acquisition campaigns.
          </p>

          {loading ? (
            <div className="mt-12 rounded-3xl border border-line bg-surface p-12 text-center text-muted">
              <Sparkles className="mx-auto h-6 w-6 animate-spin text-lime" />
              <p className="mt-2 text-sm font-medium">Analyzing property campaign metrics…</p>
            </div>
          ) : data ? (
            <div className="mt-10 space-y-8">
              {/* Summary Verdict Box */}
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
                <h3 className="font-serif text-xl text-ink border-b border-line pb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-lime" /> AI Comparison Summary
                </h3>
                <p className="mt-3 text-[0.92rem] text-muted leading-relaxed">{data.comparisonSummary}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {data.suitabilityContexts.map((sc, i) => (
                    <div key={i} className="rounded-2xl border border-line bg-bg p-4">
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted font-medium block">
                        Best For: {sc.persona}
                      </span>
                      <span className="font-serif text-lg font-bold text-ink mt-1 block">
                        {sc.recommendedSlug === "palmiera-2-oasis" ? "Palmiera 2 — The Oasis" : "ELO — DAMAC Hills 2"}
                      </span>
                      <p className="mt-2 text-[0.8rem] text-muted">{sc.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-card">
                <table className="w-full text-left text-[0.88rem]">
                  <thead>
                    <tr className="border-b border-line bg-bg font-serif text-base text-ink">
                      <th className="p-4">Category</th>
                      <th className="p-4">Palmiera 2 — The Oasis</th>
                      <th className="p-4">ELO — DAMAC Hills 2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-muted">
                    {data.categoryComparison.map((row, i) => (
                      <tr key={i} className="hover:bg-bg/40 transition-colors">
                        <td className="p-4 font-medium text-ink">{row.category}</td>
                        <td className="p-4">{row.values["palmiera-2-oasis"]}</td>
                        <td className="p-4">{row.values["elo-damac"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
