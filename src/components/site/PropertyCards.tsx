"use client";

import { useState } from "react";
import { MapPin, Bookmark, ArrowUpRight } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import type { Property } from "@/lib/properties";
import { useSite } from "./SiteProvider";
import { useHabibi } from "@/components/web3/Web3Provider";
import { usePools } from "@/lib/web3/hooks";
import { eth, bpsToPercent } from "@/lib/web3/format";
import { cn } from "@/lib/cn";

function StatusTag({ status }: { status: Property["status"] }) {
  const preview = status === "Preview";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-medium backdrop-blur",
        preview ? "bg-lime text-ink" : "bg-ink/70 text-surface",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", preview ? "bg-ink pulse-dot" : "bg-surface/70")} />
      {status}
    </span>
  );
}

function SaveButton({ name }: { name: string }) {
  const { showToast } = useSite();
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setSaved((s) => !s);
        showToast(saved ? `Removed ${name} from watchlist` : `Saved ${name} to watchlist`);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
      className="focus-lime inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/85 text-ink/70 shadow-sm backdrop-blur transition-colors hover:text-ink"
    >
      <Bookmark className="h-4 w-4" strokeWidth={1.75} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

function PoolProgress({ poolId, dark = false }: { poolId: string; dark?: boolean }) {
  const { pools, contractConfigured } = usePools();
  const ps = pools.find((x) => x.meta.slug === poolId);
  if (!contractConfigured || !ps) return null;
  return (
    <div>
      <div className={cn("flex items-center justify-between text-[0.74rem]", dark ? "text-surface/60" : "text-muted")}>
        <span>
          {eth(ps.totalContributedWei)} of {eth(ps.fundingTargetWei)}
        </span>
        <span className={dark ? "text-lime" : "font-medium text-ink"}>{bpsToPercent(ps.bps, 0)} filled</span>
      </div>
      <div className={cn("mt-1.5 h-1.5 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-ink/[0.08]")}>
        <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${ps.bps / 100}%` }} />
      </div>
      {ps.userUnits > 0n && (
        <p className={cn("mt-1.5 text-[0.7rem]", dark ? "text-surface/50" : "text-muted")}>
          You hold {ps.userUnits.toString()} units
        </p>
      )}
    </div>
  );
}

/* ---------------- Featured (large) ---------------- */

export function FeaturedProperty({ property }: { property: Property }) {
  const { openPurchase } = useHabibi();
  return (
    <article className="group flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[1.75rem] shadow-card">
        <Photo
          asset={media[property.image]}
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="aspect-[4/5] w-full sm:aspect-[16/13]"
          overlay="bg-gradient-to-t from-ink/45 via-transparent to-transparent"
        />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between">
          <StatusTag status={property.status} />
          <SaveButton name={property.name} />
        </div>
        <div className="absolute inset-x-5 bottom-5 text-surface">
          <div className="flex items-center gap-1.5 text-[0.78rem] text-surface/80">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {property.location}
          </div>
          <h3 className="mt-1 font-serif text-[2rem] leading-none">{property.name}</h3>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="max-w-md text-pretty text-[0.95rem] leading-relaxed text-muted">
            {property.blurb}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Stat label="Illustrative value" value={property.value} />
            <OnchainMinStat slug={property.id} />
            <Stat label="Income profile" value={property.incomeProfile} />
          </div>
          <div className="mt-5 max-w-md">
            <PoolProgress poolId={property.id} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => openPurchase(property.id)}
          className="focus-lime group/btn inline-flex items-center gap-2 self-start rounded-full bg-ink px-5 py-2.5 text-[0.88rem] font-medium text-surface transition-colors duration-300 hover:bg-lime hover:text-ink sm:self-end"
        >
          Participate
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
            strokeWidth={2}
          />
        </button>
      </div>
    </article>
  );
}

function OnchainMinStat({ slug }: { slug: string }) {
  const { pools } = usePools();
  const ps = pools.find((x) => x.meta.slug === slug);
  if (!ps || ps.minContributionWei === 0n) return null;
  return <Stat label="Minimum" value={`From ${eth(ps.minContributionWei)}`} />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.66rem] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 font-serif text-lg text-ink">{value}</p>
    </div>
  );
}

/* ---------------- Secondary (compact) ---------------- */

export function SecondaryPropertyCard({ property }: { property: Property }) {
  const { openPurchase } = useHabibi();
  return (
    <div className="group rounded-2xl border border-line bg-surface p-3 transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-stretch gap-4">
        <div className="relative w-28 shrink-0 overflow-hidden rounded-xl sm:w-32">
          <Photo asset={media[property.image]} sizes="140px" className="h-full min-h-[6.5rem] w-full" />
          <div className="absolute left-2 top-2">
            <StatusTag status={property.status} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <div className="flex items-center gap-1.5 text-[0.72rem] text-muted">
            <MapPin className="h-3 w-3" strokeWidth={1.75} />
            <span className="truncate">{property.location}</span>
          </div>
          <h3 className="mt-0.5 font-serif text-[1.35rem] leading-tight text-ink">{property.name}</h3>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[0.8rem] text-muted">{property.type}</span>
            <span className="font-serif text-[0.95rem] text-ink">{property.value}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
        <div className="flex-1">
          <PoolProgress poolId={property.id} />
        </div>
        <button
          type="button"
          onClick={() => openPurchase(property.id)}
          className="focus-lime shrink-0 self-end rounded-full border border-ink px-4 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-ink hover:text-surface"
        >
          Participate
        </button>
      </div>
    </div>
  );
}
