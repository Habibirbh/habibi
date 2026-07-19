import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { riskDisclosure } from "@/lib/content";

export const metadata: Metadata = { title: "Risk disclosure" };

export default function RiskPage() {
  return (
    <PlaceholderPage
      eyebrow="Legal · Risk & eligibility"
      title="Understand the risks before participating."
      description="Full risk disclosures and eligibility requirements are being prepared for each opportunity. A summary is below; complete terms will be disclosed before any participation."
    >
      <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
          Summary risk disclosure
        </p>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-ink/75">
          {riskDisclosure}
        </p>
      </div>
    </PlaceholderPage>
  );
}
