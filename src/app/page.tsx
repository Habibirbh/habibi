import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/sections/Hero";
import { EditorialManifesto } from "@/components/sections/EditorialManifesto";
import { FeaturedProperties } from "@/components/sections/FeaturedProperties";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { VerificationStory } from "@/components/sections/VerificationStory";
import { OwnershipStructure } from "@/components/sections/OwnershipStructure";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PortfolioProductReveal } from "@/components/sections/PortfolioProductReveal";
import { ChainInfrastructure } from "@/components/sections/ChainInfrastructure";
import { Destinations } from "@/components/sections/Destinations";
import { DueDiligence } from "@/components/sections/DueDiligence";
import { WaitlistCTA } from "@/components/sections/WaitlistCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <a
        href="#properties"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-surface"
      >
        Skip to properties
      </a>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <EditorialManifesto />
        <FeaturedProperties />
        <ComparisonSection />
        <VerificationStory />
        <OwnershipStructure />
        <HowItWorks />
        <PortfolioProductReveal />
        <ChainInfrastructure />
        <Destinations />
        <DueDiligence />
        <WaitlistCTA />
      </main>
      <Footer />
    </>
  );
}
