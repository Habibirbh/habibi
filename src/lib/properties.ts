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
    id: "marina-residences",
    name: "Marina Residences",
    location: "Dubai Marina, Dubai",
    emirate: "Dubai",
    type: "Waterfront residence",
    category: "Apartments",
    status: "Preview",
    value: "AED 3.8M",
    minimum: "From AED 500",
    incomeProfile: "Rental property",
    blurb:
      "A contemporary waterfront residence framed by the marina — presented with structured documentation, ownership terms, and a clear rental income profile.",
    image: "marina",
    featured: true,
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
