"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { processSteps } from "@/lib/content";

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 55%"],
  });
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          titleLines={["From discovery", "to ownership."]}
          maxWidth="max-w-2xl"
        />

        <div ref={ref} className="mt-20">
          {/* Desktop horizontal */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-x-0 top-0 h-px bg-line" />
            <motion.div
              className="absolute left-0 top-0 h-px bg-ink"
              style={reduce ? { width: "100%" } : { width }}
            />
            <div className="grid grid-cols-4">
              {processSteps.map((s, i) => (
                <motion.div
                  key={s.number}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="border-l border-line px-6 pt-8 first:pl-0 first:border-l-0"
                >
                  <span className="block font-serif text-[3.5rem] leading-none text-ink/15">
                    {s.number}
                  </span>
                  <h3 className="mt-6 font-serif text-[1.6rem] text-ink">{s.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
                    {s.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile vertical */}
          <div className="relative lg:hidden">
            <div className="absolute bottom-2 left-[0.9rem] top-2 w-px bg-line" />
            <motion.div
              className="absolute left-[0.9rem] top-2 w-px bg-ink"
              style={reduce ? { height: "100%" } : { height }}
            />
            <ol className="space-y-9">
              {processSteps.map((s, i) => (
                <motion.li
                  key={s.number}
                  className="relative pl-12"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <span className="absolute left-0 top-1 h-[1.8rem] w-[1.8rem] rounded-full bg-lime" />
                  <span className="absolute left-0 top-1 flex h-[1.8rem] w-[1.8rem] items-center justify-center text-[0.75rem] font-semibold text-ink">
                    {i + 1}
                  </span>
                  <h3 className="font-serif text-[1.5rem] text-ink">
                    <span className="mr-2 text-muted">{s.number}</span>
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">
                    {s.body}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
