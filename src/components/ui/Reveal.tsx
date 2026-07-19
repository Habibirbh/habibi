"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Reveal — restrained scroll-into-view animation.
 * Fully disabled when the user prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "span" | "article";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Stagger container + item for grouped reveals. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * RevealLines — reveals a headline line by line.
 * Pass an array of strings; each renders on its own line.
 */
export function RevealLines({
  lines,
  className,
  lineClassName,
  as: Tag = "span",
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  as?: "span" | "h1" | "h2" | "h3";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // Single, reliable in-view trigger for the whole heading block. Drives every
  // line together so a line can never get stuck in its hidden initial state.
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement>}
      className={`block ${className ?? ""}`}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          {reduce ? (
            <span className={`block ${lineClassName ?? ""}`}>{line}</span>
          ) : (
            <motion.span
              className={`block ${lineClassName ?? ""}`}
              initial={{ y: "110%" }}
              animate={inView ? { y: "0%" } : { y: "110%" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </Tag>
  );
}
