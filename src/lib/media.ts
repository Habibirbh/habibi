/**
 * Centralised image library.
 *
 * Every image the site uses is registered here so photography can be swapped
 * for locally-hosted approved assets without touching components. During this
 * preview build we use Unsplash CDN photographs (permanent photo IDs, verified
 * to resolve). To move to local assets: replace `unsplash(id)` with a local
 * path in `src`, and remove the Unsplash host from next.config remotePatterns.
 *
 * Curated to avoid clichés (no Burj Khalifa / Burj Al Arab, no corporate
 * towers, no lifestyle stock) — contemporary UAE-appropriate residences,
 * façades, and interiors only.
 */

const UNSPLASH = "https://images.unsplash.com/photo-";

function unsplash(id: string) {
  return `${UNSPLASH}${id}`;
}

export interface ImageAsset {
  src: string;
  alt: string;
  /** Dominant colour for the loading placeholder (prevents flashes / CLS). */
  tone: string;
}

export const media = {
  heroResidence: {
    src: unsplash("1600585154340-be6161a56a0c"),
    alt: "Contemporary residence with warm timber and glass, lit at dusk",
    tone: "#3a352c",
  },
  marina: {
    src: unsplash("1582268611958-ebfd161ef9cf"),
    alt: "Modern waterfront residence with a reflecting pool at twilight",
    tone: "#2b3138",
  },
  elo: {
    src: "/elo-damac/image (6).jpg",
    alt: "ELO — DAMAC Hills 2 Apartment",
    tone: "#2b3138",
  },
  yas: {
    src: unsplash("1600596542815-ffad4c1539a9"),
    alt: "Low-slung contemporary villa with a landscaped pool terrace",
    tone: "#8a8a86",
  },
  palm: {
    src: "/palmiera-2/image (6).jpg",
    alt: "Palmiera 2 — The Oasis Villa",
    tone: "#7fa0ad",
  },
  downtown: {
    src: unsplash("1449157291145-7efd050a4d0e"),
    alt: "Contemporary residential apartment façade with terraced balconies",
    tone: "#9a8f7d",
  },
  facade: {
    src: unsplash("1487958449943-2429e8be8625"),
    alt: "Abstract white architectural façade with strong geometry",
    tone: "#c9ccce",
  },
  interiorLiving: {
    src: unsplash("1600607687939-ce8a6c25118c"),
    alt: "Warm minimalist living interior with natural light",
    tone: "#b7a790",
  },
  interiorLoft: {
    src: unsplash("1600210492486-724fe5c67fb0"),
    alt: "Double-height loft interior with tall windows",
    tone: "#8f8a80",
  },
  dubai: {
    src: unsplash("1568605114967-8130f3a36994"),
    alt: "Modern hillside residence glowing warmly against the evening",
    tone: "#2f3a44",
  },
  abuDhabi: {
    src: unsplash("1613490493576-7fde63acd811"),
    alt: "Glass-fronted contemporary residence at blue hour",
    tone: "#5b5f63",
  },
  sharjah: {
    src: unsplash("1600047509358-9dc75507daeb"),
    alt: "Contemporary courtyard residence in warm daylight",
    tone: "#b3a995",
  },
  darkArchitecture: {
    src: unsplash("1613490493576-7fde63acd811"),
    alt: "Contemporary residence at dusk",
    tone: "#0b0c09",
  },
} satisfies Record<string, ImageAsset>;

export type MediaKey = keyof typeof media;

/**
 * Build a sized Unsplash URL. Keeps quality high while constraining transfer.
 * For local assets this becomes a no-op (return the src unchanged).
 */
export function sized(
  src: string,
  { w, q = 70 }: { w: number; q?: number },
): string {
  if (!src.startsWith(UNSPLASH)) return src;
  return `${src}?auto=format&fit=crop&w=${w}&q=${q}`;
}
