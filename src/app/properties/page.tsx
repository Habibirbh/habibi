import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "Properties" };

export default function PropertiesPage() {
  return (
    <PlaceholderPage
      title="The property catalogue is being prepared."
      description="Habibi's first curated UAE property opportunities are being structured for the launch preview. Join the waitlist to be among the first to review them."
    />
  );
}
