"use client";

import Link from "next/link";
import {
  Wallet,
  Building2,
  Coins,
  PieChart,
  ArrowUpRight,
  Plus,
  LogOut,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { useHabibi } from "./Web3Provider";
import { usePools, usePurchaseHistory } from "@/lib/web3/hooks";
import { poolById, poolStatusLabel } from "@/lib/web3/pools";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";
import { targetChain, explorerTxUrl } from "@/lib/web3/chains";

/**
 * Portfolio reconstructed ENTIRELY from onchain state (spec §17):
 * holdings from contract reads (contributedWei / balanceOf), history from
 * indexed PropertyPurchased events. No localStorage, no fabricated valuation.
 */
export function PortfolioDashboard() {
  const { mounted, connected, address, balanceWei, chainOk, openConnect, disconnect, openPurchase } =
    useHabibi();
  const { pools, isLoading, isError, contractConfigured } = usePools();
  const history = usePurchaseHistory(address ?? undefined);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-[82rem] px-5 py-24 sm:px-8">
        <div className="h-64 animate-pulse rounded-2xl bg-bg2/60" />
      </div>
    );
  }

  if (!connected || !address) {
    return (
      <div className="mx-auto max-w-[82rem] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-md rounded-[1.75rem] border border-line bg-surface p-8 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-surface">
            <Wallet className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <h1 className="mt-6 font-serif text-3xl text-ink">Your portfolio</h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            Connect a wallet on {targetChain.name} to view your onchain property interests,
            contributions, units, and transaction history.
          </p>
          <button
            type="button"
            onClick={openConnect}
            className="focus-lime mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.9rem] font-medium text-surface transition-colors hover:bg-lime hover:text-ink"
          >
            <Wallet className="h-4 w-4" strokeWidth={2} />
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  const holdings = pools.filter((p) => p.userUnits > 0n || p.userContributedWei > 0n);
  const totalContributed = holdings.reduce((s, p) => s + p.userContributedWei, 0n);
  const totalUnits = holdings.reduce((s, p) => s + p.userUnits, 0n);

  const byEmirate = new Map<string, bigint>();
  for (const h of holdings)
    byEmirate.set(h.meta.emirate, (byEmirate.get(h.meta.emirate) ?? 0n) + h.userContributedWei);
  const allocation = ["Dubai", "Abu Dhabi", "Sharjah"].map((name) => ({
    name,
    pct:
      totalContributed > 0n
        ? Number(((byEmirate.get(name) ?? 0n) * 10_000n) / totalContributed) / 100
        : 0,
  }));

  const summary = [
    { icon: Wallet, label: "Wallet balance", value: eth(balanceWei) },
    { icon: Coins, label: "Total contributed", value: eth(totalContributed) },
    { icon: Building2, label: "Property interests", value: String(holdings.length) },
    { icon: PieChart, label: "Participation units", value: totalUnits.toString() },
  ];

  return (
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-soft/60 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ink">
            Onchain portfolio · {targetChain.name}
          </span>
          <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,3.25rem)] leading-none tracking-tight text-ink">
            Your portfolio
          </h1>
          <p className="mt-2 font-mono text-[0.8rem] text-muted">{shortAddress(address)}</p>
        </div>
        <button
          type="button"
          onClick={disconnect}
          className="focus-lime inline-flex items-center gap-2 self-start rounded-full border border-line-strong px-4 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-bg2 sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" /> Disconnect
        </button>
      </div>

      {!chainOk && (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-surface p-4 text-[0.88rem] text-ink/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b07a1a]" />
          Your wallet is not on {targetChain.name} (chain {targetChain.id}). Data below reads from
          the target network; switch networks to transact.
        </p>
      )}
      {!contractConfigured && (
        <p className="mt-6 rounded-xl border border-line bg-surface p-4 text-[0.88rem] text-muted">
          Contract address not configured for this environment.
        </p>
      )}
      {isError && (
        <p className="mt-6 rounded-xl border border-line bg-surface p-4 text-[0.88rem] text-muted">
          Could not read onchain state — the RPC endpoint may be unavailable. Retrying automatically.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <s.icon className="h-5 w-5 text-ink/70" strokeWidth={1.6} />
            <p className="mt-4 truncate font-serif text-2xl leading-none text-ink">{s.value}</p>
            <p className="mt-1.5 text-[0.75rem] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[0.75rem] text-muted">
        Current valuation unavailable — valuation updates will be provided through verified property
        reporting.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="text-[0.98rem] font-semibold text-ink">Holdings</h2>
          {isLoading ? (
            <div className="mt-4 h-40 animate-pulse rounded-2xl bg-bg2/60" />
          ) : holdings.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line-strong p-8 text-center">
              <p className="text-[0.92rem] text-muted">No onchain property interests for this wallet yet.</p>
              <Link
                href="/#properties"
                className="focus-lime mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-medium text-surface transition-colors hover:bg-lime hover:text-ink"
              >
                Explore properties <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {holdings.map((h) => {
                const share =
                  h.totalContributedWei > 0n
                    ? Number((h.userContributedWei * 10_000n) / h.totalContributedWei) / 100
                    : 0;
                return (
                  <div key={h.meta.slug} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
                        <Photo asset={media[h.meta.image]} sizes="120px" zoom={false} className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif text-[1.35rem] leading-tight text-ink">{h.meta.name}</h3>
                            <p className="text-[0.78rem] text-muted">
                              {h.meta.location} · {poolStatusLabel[h.status]}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openPurchase(h.meta.slug)}
                            className="focus-lime inline-flex shrink-0 items-center gap-1 rounded-full border border-line-strong px-3 py-1.5 text-[0.78rem] font-medium text-ink transition-colors hover:bg-ink hover:text-surface"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[0.82rem]">
                          <span className="text-muted">
                            Contributed <span className="font-medium text-ink">{eth(h.userContributedWei)}</span>
                          </span>
                          <span className="text-muted">
                            Units <span className="font-medium text-ink">{h.userUnits.toString()}</span>
                          </span>
                          <span className="text-muted">
                            Share of pool <span className="font-medium text-ink">{share.toFixed(1)}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-line pt-3">
                      <div className="flex items-center justify-between text-[0.74rem] text-muted">
                        <span>Pool {bpsToPercent(h.bps)} funded</span>
                        <span>
                          {eth(h.totalContributedWei)} / {eth(h.fundingTargetWei)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                        <div className="h-full rounded-full bg-lime" style={{ width: `${h.bps / 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[0.92rem] font-semibold text-ink">Allocation by emirate</h2>
            <div className="mt-4 space-y-3.5">
              {allocation.map((a) => (
                <div key={a.name}>
                  <div className="flex items-center justify-between text-[0.8rem]">
                    <span className="text-ink/80">{a.name}</span>
                    <span className="text-muted">{a.pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                    <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${a.pct}%` }} />
                  </div>
                </div>
              ))}
              {totalContributed === 0n && <p className="text-[0.72rem] text-muted">No allocation yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[0.92rem] font-semibold text-ink">Transaction history</h2>
            {history.isLoading ? (
              <p className="mt-3 text-[0.82rem] text-muted">Reading events…</p>
            ) : !history.data || history.data.length === 0 ? (
              <p className="mt-3 text-[0.82rem] text-muted">No purchases recorded onchain.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {history.data.slice(0, 8).map((t) => {
                  const meta = poolById(t.propertyId);
                  const url = explorerTxUrl(t.txHash);
                  return (
                    <li key={`${t.txHash}-${t.logIndex}`} className="flex items-center justify-between gap-2 py-2.5 text-[0.82rem]">
                      <span className="min-w-0 truncate text-ink/80">{meta?.name ?? `Pool ${t.propertyId}`}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-ink">{eth(t.amountWei)}</span>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View transaction on explorer"
                            className="focus-lime text-muted hover:text-ink"
                          >
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

          <Link
            href="/treasury"
            className="focus-lime flex items-center justify-between rounded-2xl border border-line bg-bg2/50 px-5 py-4 text-[0.9rem] font-medium text-ink transition-colors hover:bg-bg2"
          >
            View platform treasury
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </aside>
      </div>

      <p className="mt-10 text-center text-[0.75rem] leading-relaxed text-muted">
        Holdings are contract-recorded fractional interests read live from {targetChain.name} (chain{" "}
        {targetChain.id}); they are not, by themselves, registered land title. Participation is
        subject to the applicable terms and eligibility requirements.
      </p>
    </div>
  );
}
