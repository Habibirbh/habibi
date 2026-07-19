import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { TreasuryView } from "@/components/web3/TreasuryView";

export const metadata: Metadata = { title: "Treasury" };

export default function TreasuryPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <TreasuryView />
      </main>
      <Footer />
    </>
  );
}
