import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { PropertyDetail } from "@/components/web3/PropertyDetail";
import { campaignBySlug } from "@/lib/web3/campaigns";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = campaignBySlug(slug);
  return { title: m ? m.name : "Property" };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <PropertyDetail slug={slug} />
      </main>
      <Footer />
    </>
  );
}
