/**
 * Pool registry: maps onchain propertyIds to offchain display metadata.
 *
 * ONCHAIN (source of truth): targets, totals, minimums, unit conversion,
 * status, participants, treasury — read live from HabibiPropertyPools.
 * OFFCHAIN (this file / metadataURI): names, locations, imagery, copy.
 */

import type { MediaKey } from "@/lib/media";

export interface PoolMeta {
  /** Onchain property id in HabibiPropertyPools. */
  poolId: bigint;
  slug: string;
  name: string;
  location: string;
  emirate: "Dubai" | "Abu Dhabi" | "Sharjah";
  type: string;
  image: MediaKey;
  blurb: string;
  /** Illustrative full-property valuation label (offchain, display only). */
  valueLabel: string;
}

export const poolRegistry: PoolMeta[] = [
  {
    poolId: 1n,
    slug: "marina-residences",
    name: "Marina Residences",
    location: "Dubai Marina, Dubai",
    emirate: "Dubai",
    type: "Waterfront residence",
    image: "marina",
    blurb:
      "A contemporary waterfront residence framed by the marina — presented with structured documentation, ownership terms, and a clear rental income profile.",
    valueLabel: "AED 3.8M",
  },
  {
    poolId: 2n,
    slug: "yas-waterfront",
    name: "Yas Waterfront",
    location: "Yas Island, Abu Dhabi",
    emirate: "Abu Dhabi",
    type: "Waterfront residence",
    image: "yas",
    blurb: "A low-slung waterfront home on Yas Island with a landscaped terrace.",
    valueLabel: "AED 6.2M",
  },
  {
    poolId: 3n,
    slug: "palm-garden-villa",
    name: "Palm Garden Villa",
    location: "Jumeirah, Dubai",
    emirate: "Dubai",
    type: "Residential villa",
    image: "palm",
    blurb: "A private villa framed by mature palms and a garden pool.",
    valueLabel: "AED 9.5M",
  },
  {
    poolId: 4n,
    slug: "downtown-residence",
    name: "Downtown Residence",
    location: "Downtown Dubai",
    emirate: "Dubai",
    type: "Urban apartment",
    image: "downtown",
    blurb: "A terraced apartment in the heart of Downtown Dubai.",
    valueLabel: "AED 2.4M",
  },
];

export function poolBySlug(slug: string): PoolMeta | undefined {
  return poolRegistry.find((p) => p.slug === slug);
}

export function poolById(id: bigint): PoolMeta | undefined {
  return poolRegistry.find((p) => p.poolId === id);
}

/** Onchain status enum mirror. */
export enum PoolStatus {
  None = 0,
  Draft = 1,
  Scheduled = 2,
  Open = 3,
  Funded = 4,
  Closed = 5,
  Cancelled = 6,
}

export const poolStatusLabel: Record<PoolStatus, string> = {
  [PoolStatus.None]: "Unknown",
  [PoolStatus.Draft]: "Draft",
  [PoolStatus.Scheduled]: "Scheduled",
  [PoolStatus.Open]: "Open",
  [PoolStatus.Funded]: "Funded",
  [PoolStatus.Closed]: "Closed",
  [PoolStatus.Cancelled]: "Cancelled",
};
