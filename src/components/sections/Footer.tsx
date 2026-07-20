import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { footerColumns, riskDisclosure } from "@/lib/content";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-dark text-surface">
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-40" />
      <Container className="relative">
        {/* Risk disclosure */}
        <div className="border-b border-white/10 py-12">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:gap-8">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-lime">
              Risk disclosure
            </p>
            <p className="max-w-4xl text-[0.85rem] leading-relaxed text-surface/55">
              {riskDisclosure}
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo onDark />
            <p className="mt-4 text-[0.88rem] leading-relaxed text-surface/55">
              Fractional access to curated UAE real estate through a modern
              property platform built for Robinhood Chain.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] text-surface/70">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              Launching in the UAE
            </span>
          </div>

          {footerColumns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-surface/40">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="nav-underline focus-lime rounded text-[0.88rem] text-surface/70 transition-colors hover:text-surface"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8rem] text-surface/45">
            © 2026 Habibi. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <p className="text-[0.8rem] text-surface/45">
              Designed for fractional UAE real estate.
            </p>
            <a
              href="https://x.com/HabibiRBH?s=20"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Habibi on X"
              className="focus-lime inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-surface/70 transition-colors hover:text-surface"
            >
              <XIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
