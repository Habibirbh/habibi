import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <PlaceholderPage
      eyebrow="How it works"
      title="A closer look is on the way."
      description="Discover, review, participate, and manage — the full walkthrough of the Habibi property journey will live here. See the overview on the landing page in the meantime."
    />
  );
}
