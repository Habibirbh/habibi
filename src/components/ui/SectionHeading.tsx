import { Reveal, RevealLines } from "./Reveal";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  titleLines,
  description,
  align = "left",
  onDark = false,
  className,
  maxWidth = "max-w-2xl",
}: {
  eyebrow: string;
  titleLines: string[];
  description?: string;
  align?: "left" | "center";
  onDark?: boolean;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "mx-auto text-center" : "text-left",
        maxWidth,
        className,
      )}
    >
      <Reveal>
        <span
          className={cn(
            "eyebrow inline-flex items-center gap-2",
            onDark && "text-surface/55",
          )}
        >
          <span className="h-px w-6 bg-lime" />
          {eyebrow}
        </span>
      </Reveal>
      <RevealLines
        as="h2"
        lines={titleLines}
        className={cn(
          "mt-4 font-serif text-[2.1rem] leading-[1.03] tracking-[-0.02em] sm:text-[2.9rem]",
          onDark ? "text-surface" : "text-ink",
        )}
      />
      {description && (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "mt-5 text-pretty text-[1rem] leading-relaxed",
              align === "center" && "mx-auto",
              onDark ? "text-surface/60" : "text-muted",
              "max-w-xl",
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
