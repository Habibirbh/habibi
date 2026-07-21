"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { PortfolioPreviewCard } from "@/components/site/PortfolioPreviewCard";

const EASE = [0.22, 1, 0.36, 1] as const;

const trust = ["Curated properties", "Fractional access", "Transparent records"];

export function Hero() {
  const reduce = useReducedMotion();

  const line = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { y: "115%" },
          animate: { y: "0%" },
          transition: { duration: 0.95, ease: EASE, delay },
        };

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: EASE, delay },
        };

  const float = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.9, ease: EASE, delay },
        };

  return (
    <section className="relative overflow-hidden">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-10%] hidden h-[42rem] w-[42rem] rounded-full bg-lime-soft/30 blur-[120px] lg:block"
      />

      <div className="relative mx-auto grid max-w-[82rem] items-center gap-10 px-5 pb-16 pt-10 sm:px-8 lg:min-h-[88vh] lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] lg:gap-12 lg:pb-24 lg:pt-8">
        {/* -------- Left -------- */}
        <div className="max-w-xl lg:pr-4">
          <motion.span
            {...rise(0)}
            className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            UAE Real Estate · Robinhood Chain
          </motion.span>

          <h1 className="mt-5 font-serif text-[clamp(3.25rem,8vw,6.25rem)] leading-[0.94] tracking-[-0.02em] text-ink">
            <span className="block overflow-hidden">
              <motion.span className="block" {...line(0.05)}>
                Own a piece
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span className="block italic text-ink/90" {...line(0.15)}>
                of the UAE.
              </motion.span>
            </span>
          </h1>

          <motion.p
            {...rise(0.3)}
            className="mt-7 max-w-md text-pretty text-[1.05rem] leading-relaxed text-muted"
          >
            Discover curated real estate across the UAE. Participate
            fractionally, manage your holdings, and build a property portfolio
            through one modern platform.
          </motion.p>

          <motion.div
            {...rise(0.4)}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <Link
              href="/#properties"
              className="focus-lime group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[0.95rem] font-medium text-surface transition-colors duration-300 hover:bg-lime hover:text-ink"
            >
              Explore properties
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
            <Link
              href="/#how-it-works"
              className="nav-underline focus-lime rounded text-[0.95rem] font-medium text-ink"
            >
              See how it works
            </Link>
          </motion.div>

          {/* Contract Address Badge */}
          <motion.div
            {...rise(0.45)}
            className="mt-6 flex flex-col gap-1.5 rounded-2xl border border-line bg-surface/60 p-3.5 max-w-md shadow-xs"
          >
            <span className="text-[0.62rem] uppercase tracking-wider text-muted font-bold">
              CA
            </span>
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono text-[0.78rem] text-ink/95 select-all break-all">
                0xB20691eEb45c1C00B4c74479a47F18D9311112B4
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("0xB20691eEb45c1C00B4c74479a47F18D9311112B4");
                }}
                className="rounded-full bg-ink px-3 py-1 text-[0.68rem] font-medium text-surface hover:bg-lime hover:text-ink transition-all active:scale-95"
              >
                Copy
              </button>
            </div>
          </motion.div>

          <motion.ul
            {...rise(0.5)}
            className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line pt-6"
          >
            {trust.map((t) => (
              <li key={t} className="flex items-center gap-2 text-[0.82rem] text-muted">
                <span className="h-1 w-1 rounded-full bg-lime" />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* -------- Right composition -------- */}
        <motion.div
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 1, ease: EASE, delay: 0.15 },
              })}
          className="relative"
        >
          {/* blueprint elevation ticks behind image */}
          <div
            aria-hidden
            className="absolute -left-4 top-8 hidden h-[70%] w-px bg-line-strong lg:block"
          />

          <div className="group relative">
            <Photo
              asset={media.heroResidence}
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="aspect-[4/5] w-full rounded-[2rem] shadow-float sm:aspect-[16/12] lg:aspect-[15/16]"
              imgClassName="group-hover:scale-[1.03]"
            />

            {/* location marker */}
            <motion.div
              {...float(0.55)}
              className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-[0.72rem] font-medium text-ink shadow-sm backdrop-blur"
            >
              <MapPin className="h-3.5 w-3.5 text-ink/70" strokeWidth={1.75} />
              Dubai Marina
            </motion.div>

            {/* fraction panel */}
            <motion.div
              {...float(0.7)}
              className="absolute right-4 top-4 w-[10.5rem] rounded-2xl border border-line bg-surface/95 p-3.5 shadow-card backdrop-blur"
            >
              <p className="text-[0.62rem] uppercase tracking-wider text-muted">
                Fractional access
              </p>
              <div className="mt-1.5 flex items-end justify-between">
                <div>
                  <p className="text-[0.62rem] text-muted">From</p>
                  <p className="font-serif text-2xl leading-none text-ink">
                    AED 500
                  </p>
                </div>
                <span className="mb-0.5 h-2 w-2 rounded-full bg-lime" />
              </div>
            </motion.div>
          </div>

          {/* Portfolio panel overlapping the image */}
          <motion.div
            {...float(0.6)}
            className="relative z-10 mx-auto -mt-20 w-[88%] sm:absolute sm:-bottom-8 sm:-left-6 sm:mt-0 sm:w-[18rem]"
          >
            <PortfolioPreviewCard />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
