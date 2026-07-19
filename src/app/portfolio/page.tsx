import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { CampaignPortfolio } from "@/components/web3/CampaignPortfolio";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <CampaignPortfolio />
      </main>
      <Footer />
    </>
  );
}
