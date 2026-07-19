"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RevealLines, Reveal } from "@/components/ui/Reveal";
import { comparison } from "@/lib/content";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

export function ComparisonSection() {
  const reduce = useReducedMotion();

  const row = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.5, delay: i * 0.08, ease: EASE },
        };

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <div className="max-w-3xl">
          <Reveal>
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
              A different approach
            </span>
          </Reveal>
          <RevealLines
            as="h2"
            lines={["Property ownership,", "without the traditional friction."]}
            className="mt-5 font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.04] tracking-[-0.02em] text-ink"
          />
        </div>

        <div className="mt-16 grid gap-x-16 gap-y-10 lg:grid-cols-2">
          {/* Traditional — muted */}
          <div>
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <h3 className="text-[1.05rem] font-medium text-muted">
                {comparison.traditional.title}
              </h3>
              <span className="text-[0.72rem] uppercase tracking-wider text-muted/70">
                Before
              </span>
            </div>
            <ul>
              {comparison.traditional.points.map((p, i) => (
                <motion.li
                  key={p}
                  {...row(i)}
                  className="flex items-center gap-4 border-b border-line py-4 text-[1.05rem] text-muted"
                >
                  <span className="w-6 font-mono text-[0.8rem] text-stone">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {p}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Habibi — strong */}
          <div>
            <div className="flex items-baseline justify-between border-b border-ink pb-4">
              <h3 className="font-serif text-[1.5rem] text-ink">
                {comparison.habibi.title}
              </h3>
              <span className="rounded-full bg-lime px-2.5 py-0.5 text-[0.68rem] font-medium text-ink">
                With Habibi
              </span>
            </div>
            <ul>
              {comparison.habibi.points.map((p, i) => (
                <motion.li
                  key={p}
                  {...row(i)}
                  className={cn(
                    "flex items-center gap-4 border-b border-line py-4 text-[1.05rem] font-medium text-ink",
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime text-[0.7rem] font-semibold text-ink">
                    {i + 1}
                  </span>
                  {p}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
