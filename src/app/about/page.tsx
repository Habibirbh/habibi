import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PlaceholderPage
      eyebrow="About Habibi"
      title="More about Habibi, soon."
      description="Habibi is building a modern, transparent way to access curated UAE real estate fractionally. Our full story, team, and contact details will be published here shortly."
    />
  );
}
