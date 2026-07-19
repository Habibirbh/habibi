import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <PlaceholderPage
      eyebrow="Marketplace"
      title="A compliant marketplace is planned."
      description="Buying and selling eligible property fractions through a future, compliant secondary marketplace is on the Habibi roadmap. Availability will depend on eligibility and applicable requirements."
    />
  );
}
