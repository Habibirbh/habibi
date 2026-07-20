"use client";

import { useState } from "react";
import Link from "next/link";
import { usePublicClient, useWriteContract, useAccount } from "wagmi";
import { Wallet, Coins, Building2, PieChart, ArrowUpRight, ExternalLink, LogOut, AlertTriangle, RefreshCw, Check } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { useHabibi } from "./Web3Provider";
import { useUserCampaigns, type OnchainCampaign } from "@/lib/web3/useCampaigns";
import { campaignsAbi, campaignsContractAddress, CampaignState, campaignStateLabel } from "@/lib/web3/campaigns";
import { targetChain, explorerTxUrl } from "@/lib/web3/chains";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";

/**
 * Portfolio derived entirely from onchain campaign state (spec §6/§7). Three
 * distinct position types — Conditional commitment / Acquired interest /
 * Refundable — never a single generic "ownership" state. No localStorage.
 */
export function CampaignPortfolio() {
  const { mounted, connected, address, chainOk, openConnect, disconnect } = useHabibi();
  const { positions, configured, isLoading, refetch } = useUserCampaigns();

  if (!mounted) {
    return <div className="mx-auto max-w-[82rem] px-5 py-24 sm:px-8"><div className="h-64 animate-pulse rounded-2xl bg-bg2/60" /></div>;
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
            Connect a wallet on {targetChain.name} to view your conditional commitments, acquired interests, and refunds.
          </p>
          <button onClick={openConnect} className="focus-lime mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.9rem] font-medium text-surface transition-colors hover:bg-lime hover:text-ink">
            <Wallet className="h-4 w-4" strokeWidth={2} /> Connect wallet
          </button>
        </div>
      </div>
    );
  }

  const mine = positions.filter((p) => p.userContributedWei > 0n);
  const totalContributed = mine.reduce((s, p) => s + p.userContributedWei, 0n);
  const totalRefundable = mine.reduce((s, p) => s + p.userRefundableWei, 0n);
  const totalUnits = mine.reduce((s, p) => s + p.userUnits, 0n);

  const summary = [
    { icon: Coins, label: "Total contributed", value: eth(totalContributed) },
    { icon: Building2, label: "Active positions", value: String(mine.length) },
    { icon: PieChart, label: "Participation units", value: totalUnits.toString() },
    { icon: RefreshCw, label: "Refundable", value: eth(totalRefundable) },
  ];

  return (
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-soft/60 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ink">
            Onchain portfolio · {targetChain.name}
          </span>
          <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,3.25rem)] leading-none tracking-tight text-ink">Your portfolio</h1>
          <p className="mt-2 font-mono text-[0.8rem] text-muted">{shortAddress(address)}</p>
        </div>
        <button onClick={disconnect} className="focus-lime inline-flex items-center gap-2 self-start rounded-full border border-line-strong px-4 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-bg2 sm:self-auto">
          <LogOut className="h-3.5 w-3.5" /> Disconnect
        </button>
      </div>

      {!chainOk && (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-surface p-4 text-[0.88rem] text-ink/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b07a1a]" />
          Your wallet is not on {targetChain.name}. Data reads from the target network; switch to transact.
        </p>
      )}
      {!configured && <p className="mt-6 rounded-xl border border-line bg-surface p-4 text-[0.88rem] text-muted">Campaign contract not configured for this environment.</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <s.icon className="h-5 w-5 text-ink/70" strokeWidth={1.6} />
            <p className="mt-4 truncate font-serif text-2xl leading-none text-ink">{s.value}</p>
            <p className="mt-1.5 text-[0.75rem] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-[0.98rem] font-semibold text-ink">Positions</h2>
      {isLoading ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-bg2/60" />
      ) : mine.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="text-[0.92rem] text-muted">You have no conditional commitments yet.</p>
          <Link href="/properties/palmiera-2-oasis" className="focus-lime mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-medium text-surface transition-colors hover:bg-lime hover:text-ink">
            Explore the campaign <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {mine.map((p) => (
            <PositionCard key={p.meta.slug} p={p} chainOk={chainOk} refetch={refetch} />
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-[0.75rem] leading-relaxed text-muted">
        Positions are read live from {targetChain.name}. A conditional commitment is not property ownership; final
        participation interests are issued only after an acquisition completes.
      </p>
    </div>
  );
}

function positionType(state: CampaignState): { label: string; tone: string } {
  if (state === CampaignState.Refunding || state === CampaignState.Refunded) return { label: "Refundable", tone: "bg-[#e0a33d]/15 text-[#8a5a12]" };
  if (state === CampaignState.Acquired || state === CampaignState.InterestsIssued) return { label: "Acquired property interest", tone: "bg-lime text-ink" };
  return { label: "Conditional commitment", tone: "bg-ink/[0.06] text-ink/70" };
}

function PositionCard({ p, chainOk, refetch }: { p: OnchainCampaign; chainOk: boolean; refetch: () => void }) {
  const { address } = useAccount();
  const contract = campaignsContractAddress();
  const client = usePublicClient({ chainId: targetChain.id });
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState<null | "refund" | "claim">(null);
  const [err, setErr] = useState<string | null>(null);
  const [resultHash, setResultHash] = useState<`0x${string}` | null>(null);

  const pt = positionType(p.state);
  const proposedUnits = p.weiPerUnit > 0n ? p.userContributedWei / p.weiPerUnit : 0n;
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const canRefund = isDemo ? p.userRefundableWei > 0n : (p.state === CampaignState.Refunding && p.userRefundableWei > 0n);
  const canClaimUnits = (p.state === CampaignState.Acquired || p.state === CampaignState.InterestsIssued) && !p.userFinalClaimed && p.userContributedWei > 0n;
  const done = !!resultHash;

  async function act(fn: "claimRefund" | "claimUnitsAndExcess", kind: "refund" | "claim") {
    if (isDemo) {
      setBusy(kind);
      setErr(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const mockHash = ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")) as `0x${string}`;
        setResultHash(mockHash);
        if (fn === "claimRefund") {
          localStorage.removeItem(`demo_contrib_${p.meta.slug}_${address}`);
          refetch();
        }
      } catch {
        setErr("Simulated action failed.");
      } finally {
        setBusy(null);
      }
      return;
    }
    if (!contract || !client || !address) return;
    setBusy(kind);
    setErr(null);
    try {
      const { request } = await client.simulateContract({ account: address, address: contract, abi: campaignsAbi, functionName: fn, args: [p.meta.campaignId] });
      const hash = await writeContractAsync(request);
      await client.waitForTransactionReceipt({ hash });
      setResultHash(hash);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Failed";
      setErr(/User rejected|denied/i.test(m) ? "Rejected in wallet." : m.split("\n")[0].slice(0, 120));
    } finally {
      setBusy(null);
    }
  }

  const explorer = resultHash ? explorerTxUrl(resultHash) : null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex gap-4">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
          <Photo asset={media[p.meta.image]} sizes="120px" zoom={false} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/properties/${p.meta.slug}`} className="focus-lime nav-underline font-serif text-[1.35rem] leading-tight text-ink">
              {p.meta.name}
            </Link>
            <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ${pt.tone}`}>{pt.label}</span>
          </div>
          <p className="mt-0.5 text-[0.78rem] text-muted">{p.meta.location} · {campaignStateLabel[p.state]}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[0.82rem]">
            <span className="text-muted">Contributed <span className="font-medium text-ink">{eth(p.userContributedWei)}</span></span>
            <span className="text-muted">Proposed units <span className="font-medium text-ink">{proposedUnits.toString()}</span></span>
            {p.userUnits > 0n && <span className="text-muted">Final units <span className="font-medium text-ink">{p.userUnits.toString()}</span></span>}
            {p.closingTime > 0n && <span className="text-muted">Deadline <span className="font-medium text-ink">{new Date(Number(p.closingTime) * 1000).toUTCString().slice(5, 16)}</span></span>}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <div className="flex items-center justify-between text-[0.74rem] text-muted">
          <span>Campaign {bpsToPercent(p.bps)} funded</span>
          <span>{eth(p.totalCommittedWei)} / {eth(p.fundingTargetWei)}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
          <div className="h-full rounded-full bg-lime" style={{ width: `${p.bps / 100}%` }} />
        </div>
      </div>

      {(canRefund || canClaimUnits || err || done) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          {canRefund && (
            <button onClick={() => act("claimRefund", "refund")} disabled={!chainOk || busy !== null} className="focus-lime inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.8rem] font-medium text-surface transition-colors hover:bg-lime hover:text-ink disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5" /> {busy === "refund" ? "Confirming…" : `Claim refund · ${eth(p.userRefundableWei)}`}
            </button>
          )}
          {canClaimUnits && (
            <button onClick={() => act("claimUnitsAndExcess", "claim")} disabled={!chainOk || busy !== null} className="focus-lime inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.8rem] font-medium text-surface transition-colors hover:bg-lime hover:text-ink disabled:opacity-50">
              <Coins className="h-3.5 w-3.5" /> {busy === "claim" ? "Confirming…" : "Claim participation units"}
            </button>
          )}
          {done && (
            <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-ink/70"><Check className="h-4 w-4 text-lime" /> Confirmed</span>
          )}
          {explorer && (
            <a href={explorer} target="_blank" rel="noopener noreferrer" className="focus-lime inline-flex items-center gap-1 text-[0.8rem] text-muted hover:text-ink">
              Blockscout <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {err && <span className="text-[0.8rem] text-[#b4442f]">{err}</span>}
        </div>
      )}
    </div>
  );
}
