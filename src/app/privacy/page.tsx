import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PlaceholderPage
      eyebrow="Legal · Privacy"
      title="Our privacy policy is on the way."
      description="How Habibi handles your information, including cookies and waitlist details, will be documented here. During this preview, waitlist emails are stored locally in your browser only."
    />
  );
}
