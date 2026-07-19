import Image from "next/image";
import type { ImageAsset } from "@/lib/media";
import { cn } from "@/lib/cn";

/**
 * Photo — next/image wrapper with a solid tone placeholder (no layout shift,
 * no flash) and an optional slow hover zoom (drive via a parent `.group`).
 * The container must establish size (aspect ratio or explicit height).
 */
export function Photo({
  asset,
  sizes = "100vw",
  priority = false,
  className,
  imgClassName,
  zoom = true,
  overlay,
}: {
  asset: ImageAsset;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  zoom?: boolean;
  /** Optional gradient/scrim overlay classes rendered above the image. */
  overlay?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: asset.tone }}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover",
          zoom &&
            "transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]",
          imgClassName,
        )}
      />
      {overlay && <div className={cn("absolute inset-0", overlay)} />}
    </div>
  );
}
