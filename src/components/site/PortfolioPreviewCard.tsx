"use client";

import Link from "next/link";
import { Wallet, ArrowUpRight } from "lucide-react";
import { HabibiIcon } from "@/components/brand/Logo";
import { useHabibi } from "@/components/web3/Web3Provider";
import { usePools } from "@/lib/web3/hooks";
import { eth, shortAddress } from "@/lib/web3/format";
import { targetChain } from "@/lib/web3/chains";

export function PortfolioPreviewCard() {
  const { mounted, connected, address, balanceWei, openConnect } = useHabibi();
  const { pools } = usePools();

  const live = mounted && connected && address;
  const holdings = pools.filter((p) => p.userUnits > 0n);
  const totalContributed = holdings.reduce((s, p) => s + p.userContributedWei, 0n);
  const totalUnits = holdings.reduce((s, p) => s + p.userUnits, 0n);

  const stats = live
    ? [
        { value: String(holdings.length), label: "Properties" },
        { value: eth(totalContributed), label: "Contributed" },
        { value: totalUnits.toString(), label: "Units" },
      ]
    : [
        { value: "—", label: "Properties" },
        { value: "—", label: "Contributed" },
        { value: "—", label: "Units" },
      ];

  return (
    <div className="on-dark relative w-full overflow-hidden rounded-2xl border border-white/10 bg-charcoal p-5 text-surface shadow-panel">
      <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-28" />
      <div className="mashrabiya pointer-events-none absolute inset-0 opacity-[0.2]" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HabibiIcon className="h-8 w-8" onDark />
            <div>
              <p className="text-sm font-medium leading-tight">Your Habibi portfolio</p>
              <p className="font-mono text-[0.7rem] text-surface/45">
                {live ? shortAddress(address) : "Not connected"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.68rem] text-surface/60 ring-1 ring-inset ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            {targetChain.name}
          </span>
        </div>

        <p className="mt-4 text-[0.82rem] leading-relaxed text-surface/60">
          {live
            ? `Wallet balance ${eth(balanceWei)}. Holdings are read directly from the onchain contract.`
            : "Connect an EVM wallet to participate in property pools and track a fully onchain portfolio."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <p className="truncate font-serif text-xl leading-none">{s.value}</p>
              <p className="mt-1.5 text-[0.66rem] leading-tight text-surface/45">{s.label}</p>
            </div>
          ))}
        </div>

        {live ? (
          <Link
            href="/portfolio"
            className="focus-lime group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
          >
            View portfolio
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={openConnect}
            className="focus-lime group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Wallet className="h-4 w-4" strokeWidth={2} />
            Connect wallet
          </button>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3.5">
          <span className="text-[0.72rem] text-surface/45">
            Onchain state · chain {targetChain.id}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-surface/35" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
