import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <PlaceholderPage
      eyebrow="Learn"
      title="Property education, coming soon."
      description="Guides on fractional real estate, ownership structures, Robinhood Chain, and frequently asked questions will be gathered here to help you participate with confidence."
    />
  );
}
