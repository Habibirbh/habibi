import { Info, FileCheck2, Landmark, ScrollText } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { chainPillars } from "@/lib/content";

/* Abstract ownership-record ledger — fine lines, lime data points. */
function LedgerVisual() {
  const rows = [
    { icon: Landmark, label: "Property-holding entity", meta: "Legal record" },
    { icon: FileCheck2, label: "Eligible fractional interest", meta: "Participation" },
    { icon: ScrollText, label: "Portfolio activity", meta: "Onchain record" },
  ];
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-dark p-6 text-surface shadow-panel sm:p-8">
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-60" />
      <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-32" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[0.68rem] uppercase tracking-[0.16em] text-surface/45">
            Ownership record
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.66rem] text-surface/60">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Robinhood Chain
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {rows.map((r, i) => (
            <div key={r.label} className="relative">
              <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/12 text-lime">
                  <r.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="flex-1">
                  <p className="text-[0.88rem] text-surface/85">{r.label}</p>
                  <p className="text-[0.68rem] text-surface/40">{r.meta}</p>
                </div>
                <span className="font-mono text-[0.7rem] text-surface/35">
                  0x{(i + 1) * 1234}…{(i + 3) * 88}
                </span>
              </div>
              {i < rows.length - 1 && (
                <span className="ml-8 block h-3 w-px bg-white/12" aria-hidden />
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 text-[0.7rem] text-surface/35">
          Illustrative representation. Values shown are placeholders.
        </p>
      </div>
    </div>
  );
}

export function ChainInfrastructure() {
  return (
    <section id="robinhood-chain" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Built on Robinhood Chain"
          titleLines={["Real-world property,", "supported by onchain infrastructure."]}
          description="Habibi is being designed to use Robinhood Chain for eligible property-related records, portfolio activity, distributions, and transfers while keeping legal structures and participant rights clearly documented."
          maxWidth="max-w-3xl"
        />

        <div className="mt-16 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
          {/* Pillars */}
          <div className="divide-y divide-line border-y border-line">
            {chainPillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="flex flex-col gap-3 py-7 sm:flex-row sm:gap-8">
                  <div className="flex items-baseline gap-4 sm:w-64 sm:shrink-0">
                    <span className="font-mono text-[0.8rem] text-stone">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-serif text-[1.5rem] leading-tight text-ink">
                      {p.title}
                    </h3>
                  </div>
                  <p className="text-[0.95rem] leading-relaxed text-muted sm:pt-1">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Ledger */}
          <Reveal delay={0.1}>
            <LedgerVisual />
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-line bg-surface px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink/50" strokeWidth={1.75} />
            <p className="text-[0.85rem] leading-relaxed text-muted">
              Robinhood Chain infrastructure does not replace legal agreements,
              title registration, compliance obligations, or applicable property
              law. Habibi is not affiliated with, endorsed by, or partnered with
              Robinhood.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
