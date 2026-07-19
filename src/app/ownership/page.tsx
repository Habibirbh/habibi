import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "Ownership" };

export default function OwnershipPage() {
  return (
    <PlaceholderPage
      eyebrow="Ownership structure"
      title="How Habibi ownership is structured."
      description="Each opportunity defines the legal entity, beneficial interest, participant rights, fees, and transfer conditions. A full explainer will live here; see the overview on the landing page in the meantime."
    />
  );
}
