/**
 * Property preview data for Habibi.
 *
 * NOTE: All figures are illustrative preview content for the pre-launch
 * landing page. They do not represent live offerings, guarantees, or real
 * ownership. `image` references a key in src/lib/media.ts so photography can be
 * swapped centrally.
 */

import type { MediaKey } from "./media";

export type PropertyStatus = "Preview" | "Coming soon";

export type Emirate = "Dubai" | "Abu Dhabi" | "Sharjah";

export interface Property {
  id: string;
  name: string;
  location: string;
  emirate: Emirate;
  type: string;
  category: "Apartments" | "Villas";
  status: PropertyStatus;
  /** Illustrative property value, formatted string. */
  value: string;
  /** Minimum participation, formatted string. */
  minimum: string;
  /** Non-numeric income descriptor — never a guaranteed percentage. */
  incomeProfile: string;
  /** Short editorial description for the featured treatment. */
  blurb: string;
  image: MediaKey;
  featured?: boolean;
}

export const properties: Property[] = [
  {
    id: "palmiera-2-oasis",
    name: "Palmiera 2 — The Oasis",
    location: "The Oasis, Dubai",
    emirate: "Dubai",
    type: "Lagoon-facing villa · proposed acquisition",
    category: "Villas",
    status: "Preview",
    value: "Proposed acquisition",
    minimum: "Conditional",
    incomeProfile: "Conditional pre-acquisition campaign",
    blurb:
      "A proposed acquisition of a lagoon-facing villa in The Oasis, Dubai. Habibi raises conditional commitments toward a potential purchase — the property is not yet acquired, and contributions are escrowed and refundable under the stated conditions.",
    image: "palm",
    featured: true,
  },
  {
    id: "elo-damac",
    name: "ELO — DAMAC Hills 2",
    location: "DAMAC Hills 2, Dubai",
    emirate: "Dubai",
    type: "Premium park-view apartment · proposed acquisition",
    category: "Apartments",
    status: "Preview",
    value: "Proposed acquisition",
    minimum: "Conditional",
    incomeProfile: "Conditional pre-acquisition campaign",
    blurb:
      "A stylish 1-bedroom apartment in ELO, Damac Hills 2, Dubai. Modern open-plan living area, fitted kitchen, premium amenities including pool and gym.",
    image: "elo",
  },
  {
    id: "yas-waterfront",
    name: "Yas Waterfront",
    location: "Yas Island, Abu Dhabi",
    emirate: "Abu Dhabi",
    type: "Waterfront residence",
    category: "Apartments",
    status: "Coming soon",
    value: "AED 6.2M",
    minimum: "From AED 500",
    incomeProfile: "Mixed profile",
    blurb:
      "A low-slung waterfront home on Yas Island with a landscaped terrace.",
    image: "yas",
  },
  {
    id: "palm-garden-villa",
    name: "Palm Garden Villa",
    location: "Jumeirah, Dubai",
    emirate: "Dubai",
    type: "Residential villa",
    category: "Villas",
    status: "Coming soon",
    value: "AED 9.5M",
    minimum: "From AED 500",
    incomeProfile: "Rental property",
    blurb: "A private villa framed by mature palms and a garden pool.",
    image: "palm",
  },
  {
    id: "downtown-residence",
    name: "Downtown Residence",
    location: "Downtown Dubai",
    emirate: "Dubai",
    type: "Urban apartment",
    category: "Apartments",
    status: "Coming soon",
    value: "AED 2.4M",
    minimum: "From AED 500",
    incomeProfile: "Rental property",
    blurb: "A terraced apartment in the heart of Downtown Dubai.",
    image: "downtown",
  },
];

export const propertyFilters = [
  "Featured",
  "Dubai",
  "Abu Dhabi",
  "Villas",
  "Apartments",
] as const;

export type PropertyFilter = (typeof propertyFilters)[number];

export function filterProperties(
  list: Property[],
  filter: PropertyFilter,
): Property[] {
  switch (filter) {
    case "Featured":
      return list;
    case "Dubai":
    case "Abu Dhabi":
      return list.filter((p) => p.emirate === filter);
    case "Villas":
      return list.filter((p) => p.category === "Villas");
    case "Apartments":
      return list.filter((p) => p.category === "Apartments");
    default:
      return list;
  }
}
