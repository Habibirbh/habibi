"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Photo } from "@/components/ui/Photo";
import { Parallax } from "@/components/ui/Parallax";
import { RevealLines, Reveal } from "@/components/ui/Reveal";
import { media } from "@/lib/media";
import { verificationSteps } from "@/lib/content";

export function VerificationStory() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-bg2/70 py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)] lg:gap-16">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <Parallax
              intensity={30}
              className="h-[24rem] w-full rounded-[1.75rem] shadow-float sm:h-[32rem] lg:h-full"
            >
              <Photo
                asset={media.facade}
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="h-full w-full"
                zoom={false}
              />
            </Parallax>
            {/* blueprint annotation */}
            <div className="absolute bottom-5 left-5 rounded-xl bg-surface/90 px-4 py-3 shadow-card backdrop-blur">
              <p className="text-[0.62rem] uppercase tracking-wider text-muted">
                Under review
              </p>
              <p className="mt-0.5 font-serif text-lg text-ink">
                Elevation · Structure · Title
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <Reveal>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                Before it becomes an opportunity
              </span>
            </Reveal>
            <RevealLines
              as="h2"
              lines={["A property must be understood", "before it can be owned."]}
              className="mt-5 font-serif text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] text-ink"
            />
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-lg text-pretty text-[1rem] leading-relaxed text-muted">
                Every Habibi opportunity is intended to present the property,
                legal structure, associated costs, documentation, risks, and
                participation terms before access is opened.
              </p>
            </Reveal>

            <ol className="mt-10 grid gap-x-8 sm:grid-cols-2">
              {verificationSteps.map((s, i) => (
                <motion.li
                  key={s.n}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="flex gap-4 border-t border-line py-4"
                >
                  <span className="mt-0.5 font-mono text-[0.8rem] text-stone">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-[0.98rem] font-semibold text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">
                      {s.body}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
