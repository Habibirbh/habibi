"use client";

import React from "react";
import { Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { useIntelligence } from "./IntelligenceProvider";
import { useUserCampaigns } from "@/lib/web3/useCampaigns";
import { eth } from "@/lib/web3/format";

export function PortfolioIntelligenceCard() {
  const { openAssistant, hasPortfolioConsent, setHasPortfolioConsent } = useIntelligence();
  const { positions } = useUserCampaigns();

  const userPositions = positions.filter((p) => p.userContributedWei > 0n);

  const totalCommitted = userPositions.reduce((acc, p) => acc + p.userContributedWei, 0n);
  const totalPositionsCount = userPositions.length;

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-card mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/20 text-ink">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-ink">Portfolio Intelligence</h3>
            <p className="text-[0.78rem] text-muted">
              AI-assisted allocation, concentration & refund risk insights
            </p>
          </div>
        </div>

        <button
          onClick={() => openAssistant("How does my current Habibi portfolio look?")}
          className="focus-lime inline-flex items-center gap-2 self-start rounded-full bg-ink px-4 py-2 text-[0.84rem] font-medium text-surface hover:bg-lime hover:text-ink transition-colors sm:self-auto"
        >
          Analyze Portfolio <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!hasPortfolioConsent ? (
        <div className="mt-5 rounded-2xl border border-line bg-bg p-5 text-center">
          <p className="text-[0.86rem] text-ink font-medium">
            Allow Habibi Intelligence to analyze your public portfolio data?
          </p>
          <p className="mt-1 text-[0.78rem] text-muted">
            Enables personalized risk, allocation, and refund availability observations.
          </p>
          <button
            onClick={() => setHasPortfolioConsent(true)}
            className="mt-4 rounded-full bg-lime px-5 py-2 text-[0.82rem] font-medium text-ink hover:bg-ink hover:text-surface transition-colors"
          >
            Allow Session Consent
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-bg p-4">
              <span className="text-[0.68rem] uppercase tracking-wider text-muted font-medium block">
                Total Committed
              </span>
              <span className="font-serif text-2xl font-bold text-ink mt-1 block">
                {eth(totalCommitted)}
              </span>
            </div>

            <div className="rounded-2xl border border-line bg-bg p-4">
              <span className="text-[0.68rem] uppercase tracking-wider text-muted font-medium block">
                Active Positions
              </span>
              <span className="font-serif text-2xl font-bold text-ink mt-1 block">
                {totalPositionsCount}
              </span>
            </div>

            <div className="rounded-2xl border border-line bg-bg p-4">
              <span className="text-[0.68rem] uppercase tracking-wider text-muted font-medium block">
                Primary Geographic Focus
              </span>
              <span className="font-serif text-2xl font-bold text-ink mt-1 block">
                Dubai
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-line/60 bg-bg/40 p-4 space-y-2 text-[0.84rem] text-muted">
            <p className="font-medium text-ink flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-lime" /> Intelligence Observations
            </p>
            {totalPositionsCount === 0 ? (
              <p>You have no active property escrow commitments. Explore available campaigns to begin.</p>
            ) : (
              <p>
                Your portfolio holds {totalPositionsCount} active proposed acquisition commitment(s) concentrated in Dubai. All funds remain protected by smart contract escrow.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
