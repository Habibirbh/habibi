"use client";

import { useId, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Persists a waitlist signup locally for the preview build.
 * Replace `persist()` with a Supabase insert when a backend is wired in.
 */
function persist(email: string) {
  try {
    const key = "habibi.waitlist";
    const raw = window.localStorage.getItem(key);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(email)) {
      list.push(email);
      window.localStorage.setItem(key, JSON.stringify(list));
    }
  } catch {
    /* storage may be unavailable — signup UI still succeeds */
  }
}

export function WaitlistForm({
  variant = "light",
  submitLabel = "Join the waitlist",
  successNote,
  compact = false,
  autoFocus = false,
}: {
  variant?: "light" | "dark";
  submitLabel?: string;
  successNote?: string;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const dark = variant === "dark";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setError("Please enter your email address.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    persist(value);
    setDone(true);
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="success"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex items-center gap-3 rounded-md border px-4 py-3.5",
              dark
                ? "border-white/15 bg-white/[0.06] text-surface"
                : "border-line bg-surface text-ink",
            )}
            role="status"
            aria-live="polite"
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                "bg-lime text-ink",
              )}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-medium">You&rsquo;re on the Habibi list.</span>
              <span
                className={cn(
                  "text-sm",
                  dark ? "text-surface/60" : "text-muted",
                )}
              >
                We&rsquo;ll be in touch with early property updates.
              </span>
            </span>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={false}
            exit={reduce ? undefined : { opacity: 0 }}
            onSubmit={handleSubmit}
            noValidate
            className="w-full"
          >
            <div
              className={cn(
                "flex flex-col gap-2.5",
                compact ? "sm:flex-row" : "sm:flex-row",
              )}
            >
              <div className="relative flex-1">
                <label htmlFor={id} className="sr-only">
                  Email address
                </label>
                <input
                  id={id}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus={autoFocus}
                  placeholder="Enter your email address"
                  value={email}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${id}-err` : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className={cn(
                    "focus-lime h-[52px] w-full rounded-md border px-4 text-[0.95rem] outline-none transition-colors",
                    dark
                      ? "border-white/15 bg-white/[0.04] text-surface placeholder:text-surface/40 focus:border-lime/60"
                      : "border-line-strong bg-surface text-ink placeholder:text-muted/70 focus:border-ink/40",
                  )}
                />
              </div>
              <button
                type="submit"
                className={cn(
                  "focus-lime group inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-md px-6 text-[0.95rem] font-medium transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0",
                  dark
                    ? "bg-lime text-ink"
                    : "bg-ink text-surface hover:bg-charcoal",
                )}
              >
                {submitLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
            </div>
            <div className="mt-2 min-h-[1.25rem] px-1">
              {error ? (
                <p
                  id={`${id}-err`}
                  className="text-sm text-[#b4442f]"
                  role="alert"
                >
                  {error}
                </p>
              ) : successNote ? (
                <p
                  className={cn(
                    "text-sm",
                    dark ? "text-surface/55" : "text-muted",
                  )}
                >
                  {successNote}
                </p>
              ) : null}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
