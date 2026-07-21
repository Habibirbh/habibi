/**
 * Static content for the Habibi landing page.
 * Copy is intentionally calm, property-first, and free of unsupported claims.
 */

import type { MediaKey } from "./media";

export const nav = [
  { label: "Properties", href: "/#properties" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Ownership", href: "/#ownership" },
  { label: "About", href: "/about" },
  { label: "Learn", href: "/learn" },
] as const;

/* Editorial comparison — traditional vs Habibi */
export const comparison = {
  traditional: {
    title: "Traditional property buying",
    points: [
      "High capital requirement",
      "Complex paperwork",
      "Multiple intermediaries",
      "Limited flexibility",
      "Difficult portfolio diversification",
    ],
  },
  habibi: {
    title: "Habibi",
    points: [
      "Smaller participation amounts",
      "Structured property information",
      "Unified ownership records",
      "Portfolio visibility",
      "Curated UAE opportunities",
    ],
  },
} as const;

/* Property verification story steps */
export const verificationSteps = [
  { n: "01", title: "Property sourcing", body: "A prospective UAE property is identified and shortlisted." },
  { n: "02", title: "Ownership review", body: "Title, entity, and beneficial interest are examined." },
  { n: "03", title: "Valuation analysis", body: "Independent valuation and condition are assessed." },
  { n: "04", title: "Legal structuring", body: "The holding entity and participation terms are prepared." },
  { n: "05", title: "Documentation", body: "Costs, fees, risks, and disclosures are compiled." },
  { n: "06", title: "Participation terms", body: "Eligibility and transfer conditions are defined." },
] as const;

/* Section — Ownership structure */
export const ownershipLayers = [
  { label: "UAE Property", detail: "A real-world residential asset." },
  { label: "Property-holding entity", detail: "A legal entity that holds the property." },
  { label: "Eligible fractional interests", detail: "Defined, transfer-restricted participation." },
  { label: "Habibi portfolio record", detail: "Your holdings, documents and activity." },
] as const;

export const ownershipRows = [
  {
    title: "Legal structure",
    body: "The entity that holds the property and the nature of the interest you receive.",
  },
  {
    title: "Property documents",
    body: "Title, valuation, building and unit information supporting the opportunity.",
  },
  {
    title: "Participant rights",
    body: "What a fractional interest represents, and the rights attached to it.",
  },
  {
    title: "Transfer eligibility",
    body: "When and how an eligible interest may be transferred, subject to restrictions.",
  },
] as const;

/* Section — How it works */
export const processSteps = [
  { number: "01", title: "Discover", body: "Explore curated UAE property opportunities." },
  { number: "02", title: "Review", body: "Understand the property, legal structure, costs, risks, and participation terms." },
  { number: "03", title: "Participate", body: "Complete eligibility checks and acquire an eligible fractional interest." },
  { number: "04", title: "Manage", body: "Track property activity, documentation, distributions, and eligible offers." },
] as const;

/* Section — Robinhood Chain */
export const chainPillars = [
  {
    title: "Transparent records",
    body: "Eligible property-related activity can be represented through auditable onchain records.",
  },
  {
    title: "Programmable activity",
    body: "Participation, distributions, and transfer workflows can use programmable infrastructure where legally applicable.",
  },
  {
    title: "Unified experience",
    body: "Habibi brings property data, legal documentation, and onchain activity into one consumer-facing portfolio.",
  },
] as const;

/* Section — UAE destinations */
export interface Destination {
  name: string;
  arabic: string;
  body: string;
  image: MediaKey;
  count: string;
}

export const destinations: Destination[] = [
  {
    name: "Dubai",
    arabic: "دبي",
    body: "Global residential demand, established rental markets, and a wide range of property categories.",
    image: "dubai",
    count: "Opportunities in preview",
  },
  {
    name: "Abu Dhabi",
    arabic: "أبو ظبي",
    body: "Waterfront communities, premium residential developments, and long-term urban growth.",
    image: "abuDhabi",
    count: "Opportunities in preview",
  },
  {
    name: "Sharjah",
    arabic: "الشارقة",
    body: "Emerging residential opportunities with strong regional connectivity.",
    image: "sharjah",
    count: "Opportunities in preview",
  },
];

/* Section — Due diligence documents */
export const dueDiligenceDocs = [
  "Property overview",
  "Valuation summary",
  "Ownership structure",
  "Title documentation",
  "Building information",
  "Rental profile",
  "Fees and costs",
  "Risk disclosure",
  "Transfer conditions",
  "Property updates",
] as const;

/* Footer link columns */
export const footerColumns = [
  {
    heading: "Product",
    links: [
      { label: "Properties", href: "/#properties" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/about" },
      { label: "Careers", href: "/about" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Property education", href: "/learn" },
      { label: "FAQs", href: "/learn" },
      { label: "Documentation", href: "/learn" },
      { label: "Robinhood Chain", href: "/#robinhood-chain" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Risk disclosure", href: "/risk" },
      { label: "Eligibility", href: "/risk" },
      { label: "Cookies", href: "/privacy" },
    ],
  },
] as const;

export const riskDisclosure =
  "Real estate participation involves risk. Property values, rental income, liquidity, distributions, and exit timing are not guaranteed. Availability may depend on jurisdiction, eligibility, property structure, legal documentation, and regulatory requirements. Habibi does not provide investment, legal, tax, or financial advice.";
