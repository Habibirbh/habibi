import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Habibi mark — the illustrated Emirati-cat logo (public/logo.png), displayed
 * as a circular badge. The source artwork sits on a cream ground inside a gold
 * ring; a slight zoom brings that ring to the crop edge. Swap the file at
 * /public/logo.png to change the mark everywhere.
 */
export function HabibiIcon({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full ring-1",
        onDark ? "ring-white/15" : "ring-line",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="Habibi"
        fill
        sizes="72px"
        className="scale-[1.5] object-cover"
      />
    </span>
  );
}

export function Logo({
  className,
  onDark = false,
  showWordmark = true,
}: {
  className?: string;
  onDark?: boolean;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <HabibiIcon className="h-8 w-8" onDark={onDark} />
      {showWordmark && (
        <span
          className={cn(
            "font-serif text-[1.55rem] leading-none tracking-tight",
            onDark ? "text-surface" : "text-ink",
          )}
        >
          Habibi
        </span>
      )}
    </span>
  );
}
