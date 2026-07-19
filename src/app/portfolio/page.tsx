import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { PortfolioDashboard } from "@/components/web3/PortfolioDashboard";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <PortfolioDashboard />
      </main>
      <Footer />
    </>
  );
}
