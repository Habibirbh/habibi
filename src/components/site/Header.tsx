"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu,
  X,
  ArrowUpRight,
  Wallet,
  LogOut,
  LayoutDashboard,
  Landmark,
  Copy,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { nav } from "@/lib/content";
import { useHabibi } from "@/components/web3/Web3Provider";
import { useSite } from "./SiteProvider";
import { eth, shortAddress } from "@/lib/web3/format";
import { targetChain, explorerAddressUrl } from "@/lib/web3/chains";
import { cn } from "@/lib/cn";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "transition-all duration-500",
          scrolled ? "border-b border-line bg-bg/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[82rem] items-center justify-between gap-8 px-5 transition-all duration-500 sm:px-8",
            scrolled ? "h-14" : "h-20",
          )}
        >
          <Link href="/" className="focus-lime rounded-md" aria-label="Habibi home">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="nav-underline focus-lime rounded text-[0.9rem] text-ink/75 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Habibi on X"
              className="focus-lime hidden text-ink/60 transition-colors hover:text-ink sm:inline-flex"
            >
              <XIcon className="h-4 w-4" />
            </a>
            <WalletControl />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="focus-lime -mr-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink lg:hidden"
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

/* ---------------------------------------------------------------- */
/*  Wallet control — real EVM account                               */
/* ---------------------------------------------------------------- */

function WalletControl() {
  const { mounted, connected, address, balanceWei, chainOk, openConnect, disconnect } = useHabibi();
  const { showToast } = useSite();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted || !connected || !address) {
    return (
      <button
        type="button"
        onClick={openConnect}
        className="focus-lime hidden rounded-full border border-ink bg-ink px-5 py-2 text-[0.85rem] font-medium text-surface transition-colors duration-300 hover:bg-lime hover:text-ink sm:inline-flex"
      >
        Connect wallet
      </button>
    );
  }

  const explorer = explorerAddressUrl(address);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-lime flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[0.82rem] font-medium text-ink transition-colors hover:bg-bg2"
      >
        <span className={cn("h-2 w-2 rounded-full", chainOk ? "bg-lime" : "bg-[#e0a33d]")} />
        {chainOk ? eth(balanceWei) : "Wrong network"}
        <span className="hidden text-muted lg:inline">·</span>
        <span className="hidden font-mono text-[0.72rem] text-muted lg:inline">{shortAddress(address)}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
          >
            <div className="border-b border-line p-4">
              {!chainOk && (
                <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-[#e0a33d]/10 px-2.5 py-1.5 text-[0.72rem] text-ink/80">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#b07a1a]" />
                  Not on {targetChain.name} — switch in the connect dialog.
                </p>
              )}
              <p className="text-[0.7rem] uppercase tracking-wider text-muted">Balance · {targetChain.name}</p>
              <p className="mt-0.5 font-serif text-2xl text-ink">{eth(balanceWei)}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-mono text-[0.72rem] text-muted">{shortAddress(address)}</p>
                <button
                  type="button"
                  aria-label="Copy address"
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    showToast("Address copied");
                  }}
                  className="focus-lime text-muted hover:text-ink"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {explorer && (
                  <a
                    href={explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on explorer"
                    className="focus-lime text-muted hover:text-ink"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
            <div className="p-1.5">
              <MenuLink href="/portfolio" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Portfolio
              </MenuLink>
              <MenuLink href="/treasury" icon={<Landmark className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Treasury
              </MenuLink>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
                className="focus-lime flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.88rem] text-ink transition-colors hover:bg-bg2"
              >
                <LogOut className="h-4 w-4 text-muted" />
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="focus-lime flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.88rem] text-ink transition-colors hover:bg-bg2"
    >
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------------- */
/*  MobileMenu — full-screen editorial panel                        */
/* ---------------------------------------------------------------- */

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mounted, connected, address, balanceWei, openConnect, disconnect } = useHabibi();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const showAccount = mounted && connected && address;
  const mobileNav = showAccount
    ? [...nav, { label: "Portfolio", href: "/portfolio" }, { label: "Treasury", href: "/treasury" }]
    : nav;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-bg lg:hidden"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="focus-lime inline-flex h-10 w-10 items-center justify-center rounded-full text-ink"
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex flex-col px-5 pt-2 sm:px-8">
            {mobileNav.map((item, i) => (
              <motion.div
                key={item.label}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.4 }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between border-b border-line py-3.5 font-serif text-[1.9rem] leading-tight text-ink"
                >
                  {item.label}
                  <ArrowUpRight className="h-5 w-5 text-muted" strokeWidth={1.5} />
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 px-5 pb-6 sm:px-8">
            {showAccount ? (
              <>
                <div className="flex items-center justify-between rounded-full border border-line-strong px-5 py-3 text-[0.9rem]">
                  <span className="flex items-center gap-2 text-ink">
                    <Wallet className="h-4 w-4 text-muted" />
                    {eth(balanceWei)}
                  </span>
                  <button type="button" onClick={() => disconnect()} className="focus-lime text-[0.82rem] font-medium text-muted">
                    Disconnect
                  </button>
                </div>
                <Link
                  href="/portfolio"
                  onClick={onClose}
                  className="focus-lime w-full rounded-full bg-ink px-5 py-3.5 text-center font-medium text-surface"
                >
                  View portfolio
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openConnect();
                  }}
                  className="focus-lime w-full rounded-full bg-ink px-5 py-3.5 text-center font-medium text-surface"
                >
                  Connect wallet
                </button>
              </>
            )}
          </div>

          <div className="relative h-40 w-full shrink-0">
            <Photo
              asset={media.facade}
              sizes="100vw"
              zoom={false}
              className="h-full w-full"
              overlay="bg-gradient-to-t from-bg/30 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
