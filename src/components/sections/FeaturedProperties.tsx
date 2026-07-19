"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import {
  FeaturedProperty,
  SecondaryPropertyCard,
} from "@/components/site/PropertyCards";
import { PropertyFilters } from "@/components/site/PropertyFilters";
import { useSite } from "@/components/site/SiteProvider";
import {
  properties,
  filterProperties,
  type PropertyFilter,
} from "@/lib/properties";

export function FeaturedProperties() {
  const { showToast } = useSite();
  const [active, setActive] = useState<PropertyFilter>("Featured");
  const list = filterProperties(properties, active);
  const [lead, ...rest] = list;

  return (
    <section id="properties" className="scroll-mt-24 bg-bg2/60 py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <div className="flex flex-col gap-8 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Curated UAE property"
            titleLines={["Start with properties", "worth knowing."]}
            description="Explore carefully presented UAE real estate opportunities with clear documentation, ownership terms, costs, and risk information."
            maxWidth="max-w-xl"
          />
          <Reveal delay={0.1} className="lg:pb-1">
            <PropertyFilters active={active} onChange={setActive} />
          </Reveal>
        </div>

        {/* Mobile: horizontal snap rail */}
        <div className="mt-10 lg:hidden">
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
            {list.map((p) => (
              <div key={p.id} className="w-[86%] shrink-0 snap-center">
                {p.id === lead?.id ? (
                  <FeaturedProperty property={p} />
                ) : (
                  <SecondaryPropertyCard property={p} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: large featured + editorial column */}
        <div className="mt-12 hidden gap-8 lg:grid lg:grid-cols-[minmax(0,57%)_minmax(0,43%)]">
          <AnimatePresence mode="wait">
            {lead && (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <FeaturedProperty property={lead} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {rest.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SecondaryPropertyCard property={p} />
                </motion.div>
              ))}
            </AnimatePresence>
            {rest.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line-strong p-6 text-[0.9rem] text-muted">
                More opportunities in this market are being prepared.
              </p>
            )}
          </div>
        </div>

        <Reveal delay={0.05} className="mt-12 flex items-center justify-between border-t border-line pt-8">
          <p className="max-w-sm text-[0.82rem] text-muted">
            Preview information is illustrative. Full documentation is disclosed
            before participation.
          </p>
          <button
            type="button"
            onClick={() => showToast("The full property catalogue is coming soon")}
            className="focus-lime group inline-flex shrink-0 items-center gap-2 text-[0.9rem] font-medium text-ink"
          >
            <span className="nav-underline">View all properties</span>
            <span className="text-muted">·</span>
            <span className="text-muted">Coming soon</span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
