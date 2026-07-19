"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutGrid,
  Building2,
  FileText,
  Coins,
  Tag,
  Wallet,
  Bell,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { HabibiIcon } from "@/components/brand/Logo";
import { media } from "@/lib/media";
import { properties } from "@/lib/properties";
import { useHabibi } from "@/components/web3/Web3Provider";
import { usePools } from "@/lib/web3/hooks";
import { eth, shortAddress } from "@/lib/web3/format";

const EASE = [0.22, 1, 0.36, 1] as const;

const sidebar = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Properties", icon: Building2 },
  { label: "Documents", icon: FileText },
  { label: "Distributions", icon: Coins },
  { label: "Marketplace", icon: Tag },
];

export function PortfolioProductReveal() {
  const reduce = useReducedMotion();
  const { mounted, connected, address, balanceWei, openConnect, openPurchase } = useHabibi();
  const { pools } = usePools();

  const live = mounted && connected && address;
  const holdings = pools.filter((p) => p.userUnits > 0n);
  const totalInvestedWei = holdings.reduce((s, p) => s + p.userContributedWei, 0n);
  const totalUnits = holdings.reduce((s, p) => s + p.userUnits, 0n);

  const summary = [
    { icon: Building2, label: "Property interests", value: live ? String(holdings.length) : "0" },
    { icon: Wallet, label: "Contributed", value: live ? eth(totalInvestedWei) : "0 ETH" },
    { icon: Coins, label: "Available distributions", value: "0 ETH" },
    { icon: LayoutGrid, label: "Units held", value: live ? totalUnits.toString() : "0" },
  ];

  const byEmirate = new Map<string, bigint>();
  for (const h of holdings) byEmirate.set(h.meta.emirate, (byEmirate.get(h.meta.emirate) ?? 0n) + h.userContributedWei);
  const emirates = ["Dubai", "Abu Dhabi", "Sharjah"].map((name) => ({
    name,
    pct: totalInvestedWei > 0n ? Number(((byEmirate.get(name) ?? 0n) * 10_000n) / totalInvestedWei) / 100 : 0,
  }));
  const totalInvested = totalInvestedWei;

  const mod = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.6, delay: i * 0.06, ease: EASE },
        };

  const drift = (delay: number) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -6, 0] },
          transition: { duration: 6, delay, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <section className="relative overflow-hidden bg-dark py-20 text-surface sm:py-28">
      <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-96" />
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative mx-auto max-w-[82rem] px-5 sm:px-8">
        <span className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-lime">
          <span className="h-px w-6 bg-lime" />
          Habibi Portfolio
        </span>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-2xl font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.03] tracking-[-0.02em]">
            Your UAE property portfolio, organized in one place.
          </h2>
          <p className="max-w-md text-[0.98rem] leading-relaxed text-surface/55">
            Monitor property interests, documentation, distributions,
            valuations, updates, and eligible marketplace activity through one
            unified dashboard.
          </p>
        </div>

        {/* Dashboard */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative mt-14"
        >
          {/* Floating widgets (desktop) */}
          <motion.div
            {...drift(0)}
            className="absolute -left-4 top-24 z-20 hidden w-56 rounded-2xl border border-white/10 bg-charcoal/90 p-4 shadow-panel backdrop-blur xl:block"
          >
            <div className="flex items-center gap-2 text-lime">
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-[0.72rem] font-medium text-surface/80">New document</span>
            </div>
            <p className="mt-2 text-[0.8rem] text-surface/60">
              Sample valuation summary added to a preview opportunity.
            </p>
            <span className="mt-2 inline-block text-[0.66rem] text-surface/35">Preview only</span>
          </motion.div>

          <motion.div
            {...drift(1.2)}
            className="absolute -right-4 top-40 z-20 hidden w-52 rounded-2xl border border-white/10 bg-charcoal/90 p-4 shadow-panel backdrop-blur xl:block"
          >
            <div className="flex items-center gap-2 text-lime">
              <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-[0.72rem] font-medium text-surface/80">Allocation</span>
            </div>
            <p className="mt-2 text-[0.8rem] text-surface/60">
              Diversify across Dubai, Abu Dhabi and Sharjah.
            </p>
            <div className="mt-3 flex gap-1">
              {[40, 26, 16].map((w, i) => (
                <span key={i} className="h-1.5 rounded-full bg-lime/70" style={{ width: `${w}%` }} />
              ))}
            </div>
          </motion.div>

          {/* Frame */}
          <div className="relative z-10 overflow-hidden rounded-[1.5rem] border border-white/10 bg-charcoal/80 shadow-panel backdrop-blur">
            {/* toolbar */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-lime/70" />
                </span>
                <span className="ml-2 text-[0.8rem] font-medium text-surface/75">Habibi · Portfolio</span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.66rem] text-surface/50">
                Live onchain state
              </span>
            </div>

            <div className="grid lg:grid-cols-[13rem_1fr]">
              {/* sidebar */}
              <aside className="hidden flex-col border-r border-white/10 p-4 lg:flex">
                <div className="flex items-center gap-2 px-2 pb-4">
                  <HabibiIcon className="h-6 w-6" onDark />
                  <span className="font-serif text-lg text-surface">Habibi</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {sidebar.map((s) => (
                    <span
                      key={s.label}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[0.85rem] ${
                        s.active ? "bg-white/[0.06] text-surface" : "text-surface/50"
                      }`}
                    >
                      <s.icon className="h-4 w-4" strokeWidth={1.75} />
                      {s.label}
                    </span>
                  ))}
                </nav>
                <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[0.7rem] text-surface/50">Wallet</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[0.8rem] text-surface/80">
                    <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-lime" : "bg-stone"}`} />
                    {live ? shortAddress(address) : "Not connected"}
                  </p>
                </div>
              </aside>

              {/* main */}
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.8rem] text-surface/50">Overview</p>
                    <p className="font-serif text-xl text-surface">
                      {live ? `${eth(balanceWei)} wallet balance` : "Welcome to Habibi"}
                    </p>
                  </div>
                  {live ? (
                    <Link
                      href="/portfolio"
                      className="focus-lime rounded-full bg-lime px-4 py-2 text-[0.8rem] font-medium text-ink transition-transform hover:-translate-y-0.5"
                    >
                      Open portfolio
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={openConnect}
                      className="focus-lime rounded-full bg-lime px-4 py-2 text-[0.8rem] font-medium text-ink transition-transform hover:-translate-y-0.5"
                    >
                      Connect wallet
                    </button>
                  )}
                </div>

                {/* summary tiles */}
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {summary.map((s, i) => (
                    <motion.div
                      key={s.label}
                      {...mod(i)}
                      className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <s.icon className="h-4 w-4 text-lime" strokeWidth={1.75} />
                      <p className="mt-3 font-serif text-2xl leading-none">{s.value}</p>
                      <p className="mt-1.5 text-[0.72rem] text-surface/45">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
                  {/* opportunities */}
                  <motion.div {...mod(4)} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[0.85rem] font-medium text-surface/80">Active opportunities</h3>
                      <ChevronRight className="h-4 w-4 text-surface/40" />
                    </div>
                    <ul className="mt-3 space-y-2">
                      {properties.slice(0, 3).map((p) => (
                        <li key={p.id} className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/[0.02] p-2">
                          <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-md">
                            <Photo asset={media[p.image]} sizes="60px" zoom={false} className="h-full w-full" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.82rem] text-surface/85">{p.name}</p>
                            <p className="truncate text-[0.68rem] text-surface/40">{p.location}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openPurchase(p.id)}
                            className="focus-lime shrink-0 rounded-full bg-lime px-3 py-1.5 text-[0.68rem] font-medium text-ink transition-transform hover:-translate-y-0.5"
                          >
                            Participate
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* allocation */}
                  <motion.div {...mod(5)} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                    <h3 className="text-[0.85rem] font-medium text-surface/80">Allocation by emirate</h3>
                    <div className="mt-4 space-y-3">
                      {emirates.map((e) => (
                        <div key={e.name}>
                          <div className="flex justify-between text-[0.74rem]">
                            <span className="text-surface/65">{e.name}</span>
                            <span className="text-surface/40">{e.pct.toFixed(0)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                            <div className="h-full rounded-full bg-lime/70 transition-all duration-500" style={{ width: `${e.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalInvested === 0n && (
                      <p className="mt-3 text-[0.68rem] text-surface/35">No allocation yet.</p>
                    )}
                  </motion.div>
                </div>

                {/* empty rows */}
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    { t: "Recent updates", d: "Updates appear once you hold an interest." },
                    { t: "Documents", d: "Statements will be listed here." },
                    { t: "Distributions", d: "Distribution history will appear here." },
                  ].map((m, i) => (
                    <motion.div key={m.t} {...mod(6 + i)} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <h3 className="text-[0.8rem] font-medium text-surface/75">{m.t}</h3>
                      <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-dashed border-white/12 p-3">
                        <span className="h-6 w-6 shrink-0 rounded-full bg-white/[0.05]" />
                        <p className="text-[0.72rem] leading-snug text-surface/40">{m.d}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
