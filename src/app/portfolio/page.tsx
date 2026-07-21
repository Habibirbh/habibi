import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { CampaignPortfolio } from "@/components/web3/CampaignPortfolio";

import { PortfolioIntelligenceCard } from "@/components/intelligence/PortfolioIntelligenceCard";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] pb-16">
        <CampaignPortfolio />
        <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
          <PortfolioIntelligenceCard />
        </div>
      </main>
      <Footer />
    </>
  );
}
