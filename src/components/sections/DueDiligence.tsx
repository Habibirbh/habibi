"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileText, ShieldAlert } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { dueDiligenceDocs } from "@/lib/content";

function DocumentStack() {
  const reduce = useReducedMotion();
  return (
    <div className="group relative mx-auto h-[26rem] w-full max-w-md">
      {/* back layers */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute inset-x-8 top-0 h-64 rotate-[-5deg] rounded-2xl border border-line bg-surface shadow-card transition-transform duration-500 group-hover:rotate-[-7deg]"
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.06 }}
        className="absolute inset-x-6 top-6 h-64 rotate-[3deg] rounded-2xl border border-line bg-surface shadow-card transition-transform duration-500 group-hover:rotate-[5deg]"
      />
      {/* front document */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.12 }}
        className="absolute inset-x-2 top-12 overflow-hidden rounded-2xl border border-line bg-white shadow-float"
      >
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="-rotate-[24deg] select-none text-[3.25rem] font-semibold uppercase tracking-widest text-ink/[0.04]">
            Sample
          </span>
        </span>
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-surface">
                <FileText className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div>
                <p className="font-serif text-base leading-tight text-ink">Property overview</p>
                <p className="text-[0.68rem] text-muted">Sample document · Not an offering document</p>
              </div>
            </div>
            <span className="rounded-full bg-sand/40 px-2.5 py-0.5 text-[0.6rem] font-medium text-ink/60">Draft</span>
          </div>
          <div className="mt-6 space-y-5">
            {[
              { h: "Ownership structure", w: ["92%", "74%"] },
              { h: "Valuation summary", w: ["85%", "66%", "78%"] },
              { h: "Fees and costs", w: ["70%", "88%"] },
            ].map((b) => (
              <div key={b.h}>
                <p className="text-[0.74rem] font-semibold text-ink/75">{b.h}</p>
                <div className="mt-2 space-y-1.5">
                  {b.w.map((w, j) => (
                    <span key={j} className="block h-2 rounded-full bg-ink/[0.06]" style={{ width: w }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <span className="absolute right-5 top-5 rounded-full bg-ink px-2.5 py-1 text-[0.6rem] font-medium text-surface">
            Preview only
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function DueDiligence() {
  return (
    <section className="bg-bg2/70 py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Property information"
              titleLines={["Clear information", "before participation."]}
              description="Each opportunity should provide structured information about the property, legal entity, rights, fees, risks, income profile, and transfer restrictions."
              maxWidth="max-w-lg"
            />

            <ul className="mt-10 grid gap-x-8 gap-y-0 border-t border-line sm:grid-cols-2">
              {dueDiligenceDocs.map((d, i) => (
                <Reveal as="li" key={d} delay={i * 0.04}>
                  <span className="flex items-center gap-4 border-b border-line py-3 text-[0.95rem] text-ink">
                    <span className="font-mono text-[0.72rem] text-stone">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {d}
                  </span>
                </Reveal>
              ))}
            </ul>

            <div className="mt-8 flex items-start gap-2.5 rounded-xl bg-sand/25 px-4 py-3.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" strokeWidth={1.75} />
              <p className="text-[0.82rem] leading-relaxed text-ink/70">
                Documents shown are illustrative previews only and are not
                offering documents. Final documentation is disclosed per
                opportunity before any participation.
              </p>
            </div>
          </div>

          <Reveal delay={0.1}>
            <DocumentStack />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
