import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { Sparkles, ArrowUpRight, Scale, FileText } from "lucide-react";
import Link from "next/link";

export default function IntelligenceHubPage() {
  const features = [
    {
      title: "Property Intelligence Reports",
      desc: "Deep AI-generated executive summaries, strengths, and risk disclosures for UAE property targets.",
      href: "/properties/palmiera-2-oasis",
      icon: Sparkles,
    },
    {
      title: "Property Comparison Suite",
      desc: "Side-by-side comparison of valuations, yields, risk factors, and documentation completeness.",
      href: "/intelligence/compare",
      icon: Scale,
    },
    {
      title: "Document Intelligence",
      desc: "Query campaign terms, SPV structures, and escrow rules with verified citation mapping.",
      href: "/properties/palmiera-2-oasis",
      icon: FileText,
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-bg py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* Hero Section */}
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/20 px-3.5 py-1 text-[0.78rem] font-medium text-ink">
              <Sparkles className="h-3.5 w-3.5 text-ink" /> Habibi Intelligence Suite
            </span>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-ink leading-tight">
              Understand UAE Property Before You Participate.
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted">
              Ask questions, compare opportunities, review documents, understand risks, and explore your Habibi portfolio with AI-assisted intelligence built on Robinhood Chain.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/intelligence/compare"
                className="focus-lime rounded-full bg-ink px-6 py-3 text-sm font-medium text-surface hover:bg-lime hover:text-ink transition-colors flex items-center gap-2"
              >
                Compare Properties <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link
                  key={i}
                  href={f.href}
                  className="group rounded-3xl border border-line bg-surface p-6 shadow-card hover:border-ink transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg border border-line text-ink group-hover:bg-lime transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl text-ink">{f.title}</h3>
                  <p className="mt-2 text-[0.85rem] text-muted leading-relaxed">{f.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[0.8rem] font-medium text-ink">
                    Explore module <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
