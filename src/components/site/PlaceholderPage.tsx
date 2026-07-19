import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/sections/Footer";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";

export function PlaceholderPage({
  eyebrow = "Coming soon",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="focus-lime rounded-md" aria-label="Habibi home">
            <Logo />
          </Link>
          <Link
            href="/#waitlist"
            className="focus-lime rounded-full bg-ink px-4 py-2 text-[0.85rem] font-medium text-surface transition-transform duration-300 hover:-translate-y-0.5"
          >
            Join waitlist
          </Link>
        </Container>
      </header>

      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-20 h-[30rem] w-[30rem] rounded-full bg-lime-soft/40 blur-3xl"
        />
        <Container className="relative py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-xl">
              <span className="eyebrow inline-flex items-center gap-2">
                <span className="h-px w-6 bg-lime" />
                {eyebrow}
              </span>
              <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[3.4rem]">
                {title}
              </h1>
              <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-muted">
                {description}
              </p>

              {children && <div className="mt-8">{children}</div>}

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/"
                  className="focus-lime group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[0.92rem] font-medium text-surface transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <ArrowLeft
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                    strokeWidth={2}
                  />
                  Back to home
                </Link>
                <Link
                  href="/#properties"
                  className="nav-underline focus-lime inline-flex items-center gap-1.5 rounded text-[0.92rem] font-medium text-ink"
                >
                  Explore properties
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-float">
                <Photo
                  asset={media.heroResidence}
                  sizes="(max-width: 1024px) 0px, 42vw"
                  className="h-full w-full"
                  overlay="bg-gradient-to-t from-ink/70 to-transparent"
                />
                <p className="absolute inset-x-0 bottom-0 p-6 text-[0.8rem] text-surface/85">
                  Habibi · Fractional UAE real estate
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
