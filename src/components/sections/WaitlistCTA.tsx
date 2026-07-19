import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { WaitlistForm } from "@/components/site/WaitlistForm";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";

export function WaitlistCTA() {
  return (
    <section id="waitlist" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="relative mx-auto max-w-[82rem] overflow-hidden rounded-[2rem] bg-dark px-6 py-20 text-surface sm:px-16 sm:py-28">
        {/* architectural silhouette */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20">
          <Photo asset={media.darkArchitecture} sizes="100vw" zoom={false} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-dark/40" />
        </div>
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" />
        <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-56" />

        <div className="relative max-w-2xl">
          <RevealLines
            as="h2"
            lines={["Your first UAE property", "might begin with a fraction."]}
            className="font-serif text-[clamp(2.25rem,6vw,4rem)] leading-[1.02] tracking-[-0.02em]"
          />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-surface/60">
              Join the Habibi waitlist for early access to upcoming UAE property
              opportunities, product updates, and portfolio previews.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 max-w-lg">
              <WaitlistForm
                variant="dark"
                submitLabel="Join the waitlist"
                successNote="Property updates only. No spam."
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
