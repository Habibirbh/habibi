"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ownershipLayers, ownershipRows } from "@/lib/content";
import { cn } from "@/lib/cn";

export function OwnershipStructure() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 65%"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="ownership" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Ownership structure"
          titleLines={["Real-world property requires", "real-world legal structure."]}
          maxWidth="max-w-3xl"
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)] lg:gap-20">
          {/* Schematic */}
          <div className="relative">
            <div className="blueprint pointer-events-none absolute inset-0 -m-4 rounded-2xl opacity-70" />
            <ol ref={ref} className="relative">
              {/* connecting line */}
              <div className="absolute left-[1.1rem] top-4 bottom-4 w-px bg-line" aria-hidden />
              <motion.div
                aria-hidden
                className="absolute left-[1.1rem] top-4 w-px origin-top bg-ink"
                style={reduce ? { height: "calc(100% - 2rem)" } : { height: "calc(100% - 2rem)", scaleY }}
              />
              {ownershipLayers.map((layer, i) => {
                const emphasis = i === 0 || i === ownershipLayers.length - 1;
                return (
                  <motion.li
                    key={layer.label}
                    initial={reduce ? false : { opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    className="relative mb-3 pl-12 last:mb-0"
                  >
                    <span
                      className={cn(
                        "absolute left-2 top-4 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-bg",
                        emphasis ? "bg-ink" : "bg-lime",
                      )}
                    />
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-5 py-4",
                        emphasis
                          ? "border-transparent bg-ink text-surface shadow-card"
                          : "border-line bg-surface text-ink",
                      )}
                    >
                      <div>
                        <p className="text-[0.66rem] uppercase tracking-wider opacity-55">
                          Layer {i + 1}
                        </p>
                        <p className={cn("mt-0.5", emphasis ? "font-serif text-lg" : "text-[0.95rem] font-medium")}>
                          {layer.label}
                        </p>
                      </div>
                      <p className={cn("ml-4 hidden max-w-[9.5rem] text-right text-[0.7rem] leading-tight sm:block", emphasis ? "text-surface/55" : "text-muted")}>
                        {layer.detail}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          {/* Explanation + rows */}
          <div>
            <Reveal>
              <p className="max-w-xl text-pretty text-[1.05rem] leading-relaxed text-ink/80">
                Blockchain records do not replace legal ownership documents. Each
                property opportunity must clearly define the legal entity,
                beneficial interest, participant rights, fees, restrictions, and
                transfer conditions.
              </p>
            </Reveal>

            <div className="mt-8 divide-y divide-line border-y border-line">
              {ownershipRows.map((row, i) => (
                <Reveal key={row.title} delay={i * 0.06}>
                  <div className="flex items-baseline gap-5 py-4">
                    <span className="w-8 shrink-0 font-mono text-[0.78rem] text-stone">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[1rem] font-semibold text-ink">{row.title}</h3>
                      <p className="mt-1 text-[0.9rem] leading-relaxed text-muted">
                        {row.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-sand/30 px-4 py-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" strokeWidth={1.75} />
              <p className="text-[0.82rem] leading-relaxed text-ink/70">
                Holding a blockchain record does not by itself create UAE land
                title. The exact structure may differ by property and
                jurisdiction, and is disclosed before participation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
