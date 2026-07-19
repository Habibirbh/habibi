import { Reveal, RevealLines } from "@/components/ui/Reveal";

export function EditorialManifesto() {
  return (
    <section className="relative py-24 sm:py-36">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-20">
          <div>
            <Reveal>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                The premise
              </span>
            </Reveal>
            <RevealLines
              as="h2"
              lines={[
                "The world’s most desirable",
                "real estate has traditionally",
                "belonged to the few.",
              ]}
              className="mt-8 max-w-4xl font-serif text-[clamp(2rem,5vw,3.75rem)] leading-[1.04] tracking-[-0.02em] text-ink"
            />
          </div>

          {/* architectural editorial marker */}
          <Reveal delay={0.15} className="lg:pt-4">
            <div className="border-t border-line-strong pt-6">
              <p className="text-[1.02rem] leading-relaxed text-muted">
                Habibi is designed to make carefully structured UAE property
                opportunities more accessible through fractional participation.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <span className="h-px w-10 bg-lime" />
                <span className="font-serif text-lg italic text-ink/80">
                  Now within reach.
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
