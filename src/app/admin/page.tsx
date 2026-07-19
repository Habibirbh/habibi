import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { CampaignAdmin } from "@/components/web3/CampaignAdmin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <CampaignAdmin />
      </main>
      <Footer />
    </>
  );
}
