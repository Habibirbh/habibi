"use client";

import Link from "next/link";
import { Landmark, ArrowUpRight, Info, ExternalLink, ShieldCheck } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { useUserCampaigns, useContributionHistory } from "@/lib/web3/useCampaigns";
import { campaignStateLabel, campaignsContractAddress } from "@/lib/web3/campaigns";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";
import { targetChain, explorerAddressUrl, explorerTxUrl } from "@/lib/web3/chains";

/**
 * Escrow accounting page (conditional pre-acquisition model). Funds are never
 * held in a discretionary treasury wallet: each contribution sits in the
 * HabibiCampaigns escrow, attributed per campaign, and can only leave via
 *  - claimRefund   (back to the contributor if a campaign fails/cancels), or
 *  - releaseAcquisitionFunds (to an authorized acquisition destination).
 *
 * Three distinct figures, never conflated:
 *  A. Escrow held onchain  — committed − released − refunded (held right now)
 *  B. Released to acquisitions — left escrow under an authorized acquisition
 *  C. Refunded to contributors — returned on failed/cancelled campaigns
 */
export function TreasuryView() {
  const { positions, configured } = useUserCampaigns();
  const history = useContributionHistory();
  const escrowContract = campaignsContractAddress();

  const totalTarget = positions.reduce((s, p) => s + p.fundingTargetWei, 0n);
  const totalCommitted = positions.reduce((s, p) => s + p.totalCommittedWei, 0n);
  const totalEscrow = positions.reduce((s, p) => s + p.escrowWei, 0n);
  const totalReleased = positions.reduce((s, p) => s + p.releasedAmountWei, 0n);
  const totalRefunded = positions.reduce((s, p) => s + p.totalRefundedWei, 0n);
  const participants = positions.reduce((s, p) => s + p.participantCount, 0);
  const overallBps = totalTarget > 0n ? Number((totalCommitted * 10_000n) / totalTarget) : 0;
  const explorerEscrow = escrowContract ? explorerAddressUrl(escrowContract) : null;

  return (
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
      {/* A — escrow held onchain */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-dark p-8 text-surface shadow-panel sm:p-10">
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" />
        <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-40" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-lime">
            <Landmark className="h-3.5 w-3.5" /> Escrow · {targetChain.name}
          </span>
          <p className="mt-6 text-[0.85rem] text-surface/55">
            Held in campaign escrow now (committed − released − refunded)
          </p>
          <p className="mt-1 font-serif text-[clamp(2.5rem,7vw,4.5rem)] leading-none tracking-tight">
            {eth(totalEscrow)}
          </p>
          <div className="mt-6 max-w-xl">
            <div className="flex items-center justify-between text-[0.8rem] text-surface/60">
              <span>{eth(totalCommitted)} committed across campaigns</span>
              <span>
                {bpsToPercent(overallBps)} of {eth(totalTarget)} target · {participants} participants
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-lime transition-all duration-700" style={{ width: `${overallBps / 100}%` }} />
            </div>
          </div>

          {/* B/C — outflows + escrow contract, clearly separate */}
          <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wider text-surface/40">Released to acquisitions</p>
              <p className="mt-1 font-serif text-xl">{eth(totalReleased)}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-wider text-surface/40">Refunded to contributors</p>
              <p className="mt-1 font-serif text-xl">{eth(totalRefunded)}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-wider text-surface/40">Escrow contract</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-[0.8rem] text-surface/80">
                {escrowContract ? shortAddress(escrowContract) : "—"}
                {explorerEscrow && (
                  <a href={explorerEscrow} target="_blank" rel="noopener noreferrer" aria-label="Escrow contract on explorer" className="focus-lime text-surface/50 hover:text-surface">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </p>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-[0.72rem] leading-relaxed text-surface/45">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime/70" />
            Escrowed contributions are never forwarded to a treasury. They leave escrow only via a
            contributor refund or an authorized acquisition release, both recorded onchain. No
            participation units are issued until a campaign is acquired.
          </p>
        </div>
      </div>

      {/* per-campaign from contract accounting */}
      <div className="mt-10 flex items-end justify-between">
        <h2 className="font-serif text-2xl text-ink">Campaigns</h2>
        <Link href="/properties/palmiera-2-oasis" className="focus-lime nav-underline text-[0.88rem] font-medium text-ink">
          View a campaign
        </Link>
      </div>

      {!configured ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line-strong p-6 text-[0.9rem] text-muted">
          No campaign contract is configured for this environment yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {positions.map((p) => (
            <div key={p.meta.slug} className="flex gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
                <Photo asset={media[p.meta.image]} sizes="140px" zoom={false} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-[1.3rem] leading-tight text-ink">{p.meta.name}</h3>
                    <p className="text-[0.76rem] text-muted">
                      {p.meta.location} · {campaignStateLabel[p.state]}
                    </p>
                  </div>
                  <span className="font-medium text-ink">{bpsToPercent(p.bps, 0)}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                  <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${p.bps / 100}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[0.76rem] text-muted">
                  <span>{eth(p.totalCommittedWei)} committed</span>
                  <span>of {eth(p.fundingTargetWei)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[0.72rem] text-muted/80">
                  <span>{eth(p.escrowWei)} in escrow</span>
                  {p.releasedAmountWei > 0n && <span>{eth(p.releasedAmountWei)} released</span>}
                  {p.totalRefundedWei > 0n && <span>{eth(p.totalRefundedWei)} refunded</span>}
                </div>
                {p.userContributedWei > 0n && (
                  <p className="mt-1.5 text-[0.74rem] text-ink/70">
                    You committed {eth(p.userContributedWei)}
                    {p.userUnits > 0n && ` · ${p.userUnits.toString()} units`}
                    {p.userRefundableWei > 0n && ` · ${eth(p.userRefundableWei)} refundable`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* verified recent contributions */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-serif text-2xl text-ink">Recent verified contributions</h2>
          {history.isLoading ? (
            <p className="mt-4 text-[0.9rem] text-muted">Reading ContributionReceived events…</p>
          ) : !history.data || history.data.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-line-strong p-6 text-[0.9rem] text-muted">
              No contributions recorded onchain yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
              {history.data.slice(0, 10).map((t) => {
                const meta = positions.find((p) => p.meta.campaignId === t.campaignId)?.meta;
                const url = explorerTxUrl(t.txHash);
                return (
                  <li key={`${t.txHash}-${t.logIndex}`} className="flex items-center justify-between gap-3 px-5 py-3.5 text-[0.88rem]">
                    <span className="min-w-0">
                      <span className="block truncate text-ink/85">{meta?.name ?? `Campaign ${t.campaignId.toString()}`}</span>
                      <span className="block truncate font-mono text-[0.7rem] text-muted">
                        {shortAddress(t.contributor)} · block {t.blockNumber.toString()}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-muted">{t.proposedUnits.toString()} proposed units</span>
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
          <h3 className="mt-3 font-serif text-lg text-ink">How this escrow works</h3>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
            Every contribution is held in the campaign&apos;s onchain escrow — not a treasury wallet.
            The contract records committed, released, and refunded totals per campaign and per wallet.
            Funds are released only under an authorized acquisition, and are refundable to
            contributors if a campaign does not fund or is cancelled. The figures above are read
            directly from those records and from verified ContributionReceived events.
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
