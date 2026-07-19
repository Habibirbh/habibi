import { ArrowRight } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="relative z-40 border-b border-line bg-ink text-surface">
      <div className="mx-auto flex max-w-[78rem] items-center justify-center gap-2.5 px-5 py-2 text-center text-[0.78rem] sm:px-8">
        <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
        <span className="text-surface/85">
          Habibi is coming to Robinhood Chain.
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 shrink-0 text-lime"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
