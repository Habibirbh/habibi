import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { destinations, type Destination } from "@/lib/content";
import { cn } from "@/lib/cn";

function Panel({ d, className }: { d: Destination; className?: string }) {
  return (
    <article className={cn("group relative overflow-hidden rounded-[1.75rem] shadow-card", className)}>
      <Photo
        asset={media[d.image]}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="h-full w-full"
        overlay="bg-gradient-to-t from-ink/85 via-ink/20 to-transparent"
      />
      <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-surface/15 text-surface backdrop-blur-sm transition-colors duration-300 group-hover:bg-lime group-hover:text-ink">
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 text-surface sm:p-7">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-none">{d.name}</h3>
          <span className="text-xl text-surface/70" lang="ar" dir="rtl">
            {d.arabic}
          </span>
        </div>
        <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-surface/75">
          {d.body}
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-wider text-surface/55">
          <span className="h-1 w-1 rounded-full bg-lime" />
          {d.count}
        </p>
      </div>
    </article>
  );
}

export function Destinations() {
  const [dubai, abuDhabi, sharjah] = destinations;
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Explore the UAE"
          titleLines={["Three markets.", "Different possibilities."]}
          maxWidth="max-w-2xl"
        />

        {/* Asymmetric editorial composition */}
        <div className="mt-14 grid gap-5 lg:grid-cols-2 lg:grid-rows-2">
          <Reveal className="lg:row-span-2">
            <Panel d={dubai} className="h-[24rem] lg:h-full lg:min-h-[40rem]" />
          </Reveal>
          <Reveal delay={0.1}>
            <Panel d={abuDhabi} className="h-[24rem] lg:h-[19.5rem]" />
          </Reveal>
          <Reveal delay={0.18}>
            <Panel d={sharjah} className="h-[24rem] lg:h-[19.5rem]" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
