"use client";

import Link from "next/link";
import { Landmark, ArrowUpRight, Info, ExternalLink } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { useTreasury, usePurchaseHistory } from "@/lib/web3/hooks";
import { poolById, poolStatusLabel } from "@/lib/web3/pools";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";
import { targetChain, explorerAddressUrl, explorerTxUrl } from "@/lib/web3/chains";

/**
 * Treasury page (spec §19). Two DISTINCT values, never conflated:
 *  A. Contract-attributed inflows — authoritative platform accounting
 *  B. Live treasury wallet balance — may include unrelated funds
 * Pool fill levels derive exclusively from contract accounting.
 */
export function TreasuryView() {
  const { treasuryAddress, totalForwardedWei, liveBalanceWei, liveBalanceLoaded, pools } = useTreasury();
  const recent = usePurchaseHistory();

  const totalTarget = pools.reduce((s, p) => s + p.fundingTargetWei, 0n);
  const totalRaised = pools.reduce((s, p) => s + p.totalContributedWei, 0n);
  const overallBps = totalTarget > 0n ? Number((totalRaised * 10_000n) / totalTarget) : 0;
  const participants = pools.reduce((s, p) => s + p.participantCount, 0);
  const explorerTreasury = treasuryAddress ? explorerAddressUrl(treasuryAddress) : null;

  return (
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
      {/* A — contract-attributed inflows */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-dark p-8 text-surface shadow-panel sm:p-10">
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" />
        <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-40" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-lime">
            <Landmark className="h-3.5 w-3.5" /> Treasury · {targetChain.name}
          </span>
          <p className="mt-6 text-[0.85rem] text-surface/55">
            Contract-attributed inflows (recorded by HabibiPropertyPools)
          </p>
          <p className="mt-1 font-serif text-[clamp(2.5rem,7vw,4.5rem)] leading-none tracking-tight">
            {eth(totalForwardedWei)}
          </p>
          <div className="mt-6 max-w-xl">
            <div className="flex items-center justify-between text-[0.8rem] text-surface/60">
              <span>{eth(totalRaised)} raised across pools</span>
              <span>
                {bpsToPercent(overallBps)} of {eth(totalTarget)} target · {participants} participants
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-lime transition-all duration-700" style={{ width: `${overallBps / 100}%` }} />
            </div>
          </div>

          {/* B — live wallet, clearly separate */}
          <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wider text-surface/40">Live treasury balance</p>
              <p className="mt-1 font-serif text-xl">{liveBalanceLoaded ? eth(liveBalanceWei) : "—"}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-wider text-surface/40">Treasury address</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-[0.8rem] text-surface/80">
                {treasuryAddress ? shortAddress(treasuryAddress) : "—"}
                {explorerTreasury && (
                  <a href={explorerTreasury} target="_blank" rel="noopener noreferrer" aria-label="Treasury on explorer" className="focus-lime text-surface/50 hover:text-surface">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-wider text-surface/40">Network</p>
              <p className="mt-1 text-[0.9rem] text-surface/80">
                {targetChain.name} · chain {targetChain.id}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[0.72rem] leading-relaxed text-surface/40">
            The live treasury balance may differ from property inflows because the treasury can
            receive or send unrelated funds. Pool fill levels are never calculated from the wallet
            balance.
          </p>
        </div>
      </div>

      {/* per-pool from contract accounting */}
      <div className="mt-10 flex items-end justify-between">
        <h2 className="font-serif text-2xl text-ink">Pools</h2>
        <Link href="/#properties" className="focus-lime nav-underline text-[0.88rem] font-medium text-ink">
          Participate in a pool
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {pools.map((p) => (
          <div key={p.meta.slug} className="flex gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
              <Photo asset={media[p.meta.image]} sizes="140px" zoom={false} className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-[1.3rem] leading-tight text-ink">{p.meta.name}</h3>
                  <p className="text-[0.76rem] text-muted">
                    {p.meta.location} · {poolStatusLabel[p.status]}
                  </p>
                </div>
                <span className="font-medium text-ink">{bpsToPercent(p.bps, 0)}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${p.bps / 100}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.76rem] text-muted">
                <span>{eth(p.totalContributedWei)} raised</span>
                <span>of {eth(p.fundingTargetWei)}</span>
              </div>
              {p.userContributedWei > 0n && (
                <p className="mt-1.5 text-[0.74rem] text-ink/70">
                  You contributed {eth(p.userContributedWei)} · {p.userUnits.toString()} units
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* verified recent purchases */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-serif text-2xl text-ink">Recent verified purchases</h2>
          {recent.isLoading ? (
            <p className="mt-4 text-[0.9rem] text-muted">Reading PropertyPurchased events…</p>
          ) : !recent.data || recent.data.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-line-strong p-6 text-[0.9rem] text-muted">
              No purchases recorded onchain yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
              {recent.data.slice(0, 10).map((t) => {
                const meta = poolById(t.propertyId);
                const url = explorerTxUrl(t.txHash);
                return (
                  <li key={`${t.txHash}-${t.logIndex}`} className="flex items-center justify-between gap-3 px-5 py-3.5 text-[0.88rem]">
                    <span className="min-w-0">
                      <span className="block truncate text-ink/85">{meta?.name ?? `Pool ${t.propertyId}`}</span>
                      <span className="block truncate font-mono text-[0.7rem] text-muted">
                        {shortAddress(t.purchaser)} · block {t.blockNumber.toString()}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-muted">{t.unitsIssued.toString()} units</span>
                      <span className="font-medium text-ink">{eth(t.amountWei)}</span>
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Transaction on explorer" className="focus-lime text-muted hover:text-ink">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-bg2/50 p-6">
          <Info className="h-5 w-5 text-ink/60" strokeWidth={1.6} />
          <h3 className="mt-3 font-serif text-lg text-ink">How this accounting works</h3>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
            Every purchase forwards ETH to the treasury within the same transaction; the contract
            independently records totals per pool, per wallet, and platform-wide. The figures above
            are read from those records and from verified PropertyPurchased events — never inferred
            from the wallet balance.
          </p>
          <Link href="/portfolio" className="focus-lime mt-5 inline-flex items-center gap-2 text-[0.88rem] font-medium text-ink">
            <span className="nav-underline">Go to your portfolio</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}
