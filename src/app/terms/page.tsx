import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <PlaceholderPage
      eyebrow="Legal · Terms"
      title="Terms of use are being finalised."
      description="The terms governing use of the Habibi platform will be published here before any property opportunity opens. This preview site is informational only."
    />
  );
}
